import pandas as pd
import json
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .ml_pipeline import run_pipeline
from .models import UploadedDataset, Customer, SegmentationResult, UserProfile
from .serializers import UserSerializer
from django.core.cache import cache
from .storage import upload_csv, download_csv

def get_firebase_user(request):
    """Helper to get or create a Django user based on Firebase UID"""
    firebase_uid = request.headers.get('X-User-ID')
    if not firebase_uid:
        return None
    user, _ = User.objects.get_or_create(username=firebase_uid)
    return user


# 🔹 Upload API (User-specific)
@api_view(['POST'])
@permission_classes([AllowAny])
def upload_file(request):
    user = get_firebase_user(request)
    if not user:
        return Response({"error": "Unauthorized. Missing X-User-ID header."}, status=401)

    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)
    
    file = request.FILES['file']
    filename = file.name
    
    try:
        MAX_ROWS = 100000  # Sample limit for free-tier performance

        if filename.lower().endswith('.csv'):
            df = pd.read_csv(file)
        elif filename.lower().endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return Response({"error": "Invalid file format. Please upload a CSV or Excel file."}, status=400)

        required_columns = ['InvoiceDate', 'CustomerID', 'Quantity', 'UnitPrice', 'Description', 'InvoiceNo', 'Country']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({"error": f"Missing required columns: {', '.join(missing_columns)}"}, status=400)

        # Convert date column early
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])

        # Record original stats before any sampling
        original_rows = len(df)
        original_customers = df['CustomerID'].nunique()
        was_sampled = original_rows > MAX_ROWS

        # Sample large datasets to avoid timeouts on free-tier hosting
        if was_sampled:
            # Sample by unique customers (preserve distribution) rather than random rows
            unique_customers = df['CustomerID'].unique()
            sampled_customers = pd.Series(unique_customers).sample(
                n=min(len(unique_customers), MAX_ROWS // 5),
                random_state=42
            )
            df = df[df['CustomerID'].isin(sampled_customers)]

        # Save to user-specific directory
        user_dir = os.path.join("user_data", str(user.id))
        os.makedirs(user_dir, exist_ok=True)

        # Create database record
        dataset = UploadedDataset.objects.create(
            user=user,
            filename=filename,
            total_rows=original_rows,
            total_customers=original_customers,
            date_range_start=df['InvoiceDate'].min(),
            date_range_end=df['InvoiceDate'].max()
        )

        # Save the (possibly sampled) dataframe
        csv_path_with_id = os.path.join(user_dir, f"dataset_{dataset.id}.csv")
        df.to_csv(csv_path_with_id, index=False)

        csv_path = os.path.join(user_dir, "uploaded_data.csv")
        df.to_csv(csv_path, index=False)

        # ── Upload to Supabase Storage for persistence across server restarts ──
        upload_csv(user.id, dataset.id, df)

        # Clear user-specific cache
        cache.delete(f'dashboard_data_cache_{user.id}')
        cache.delete(f'dashboard_data_cache_{user.id}_latest')

        message = "File uploaded and validated successfully"
        if was_sampled:
            message = (
                f"File uploaded successfully. Dataset has {original_rows:,} rows — "
                f"a representative sample of {len(df):,} rows was used for analysis."
            )

        return Response({
            "message": message,
            "dataset_id": dataset.id,
            "total_rows": original_rows,
            "total_customers": original_customers,
            "sampled": was_sampled,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# 🔹 Dashboard API with User-specific Caching
@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_data(request):
    user = get_firebase_user(request)
    if not user:
        return Response({"error": "Unauthorized. Missing X-User-ID header."}, status=401)
    dataset_id = request.GET.get('dataset_id', None)
    
    # If dataset_id is provided, load that specific dataset
    if dataset_id:
        try:
            dataset = UploadedDataset.objects.get(id=dataset_id, user=user)
            user_dir = os.path.join("user_data", str(user.id))
            csv_path = os.path.join(user_dir, f"dataset_{dataset_id}.csv")
            
            # If specific dataset file doesn't exist, use the main file
            if not os.path.exists(csv_path):
                csv_path = os.path.join(user_dir, "uploaded_data.csv")
        except UploadedDataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=404)
    else:
        # Use the latest dataset
        user_dir = os.path.join("user_data", str(user.id))
        csv_path = os.path.join(user_dir, "uploaded_data.csv")
    
    cache_key = f'dashboard_data_cache_{user.id}_{dataset_id or "latest"}'
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    try:
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            # Local file missing (server restarted) — try Supabase Storage
            print(f"[Dashboard] Local CSV not found at {csv_path}, trying Supabase...")
            df = download_csv(user.id, dataset_id or "latest")
            if df is None:
                # Try downloading the specific dataset if dataset_id provided
                if dataset_id:
                    df = download_csv(user.id, dataset_id)
            if df is None:
                return Response({"error": "No data uploaded yet. Please upload a file first."}, status=400)
            # Cache locally for this session to speed up subsequent requests
            os.makedirs(os.path.dirname(csv_path), exist_ok=True)
            df.to_csv(csv_path, index=False)
    except Exception as e:
        return Response({"error": f"Failed to read dataset: {str(e)}"}, status=400)

    try:
        # Run ML pipeline
        result = run_pipeline(df)
        
        # Cache the result (1 hour)
        cache.set(cache_key, result, 3600)
        
        # Get the dataset (either specified or latest)
        if dataset_id:
            latest_dataset = UploadedDataset.objects.get(id=dataset_id, user=user)
        else:
            latest_dataset = UploadedDataset.objects.filter(user=user).last()
        
        if latest_dataset:
            # Save segmentation results
            seg_result, created = SegmentationResult.objects.update_or_create(
                dataset=latest_dataset,
                defaults={
                    'total_customers': result['stats']['total_customers'],
                    'active_customers': result['stats']['active_customers'],
                    'avg_monetary': result['stats']['avg_monetary'],
                    'total_revenue': result['stats']['total_revenue'],
                    'vip_count': result['stats']['cluster_dist'].get('VIP', 0),
                    'regular_count': result['stats']['cluster_dist'].get('Regular', 0),
                    'at_risk_count': result['stats']['cluster_dist'].get('At Risk', 0),
                }
            )
            
            # Only save customers if not already saved
            if Customer.objects.filter(dataset=latest_dataset).count() == 0:
                customers_to_create = []
                for customer_data in result['customers'][:1000]:  # Limit to 1000 for performance
                    customers_to_create.append(Customer(
                        dataset=latest_dataset,
                        customer_id=customer_data['CustomerID'],
                        recency=customer_data['Recency'],
                        frequency=customer_data['Frequency'],
                        monetary=customer_data['Monetary'],
                        cluster=0 if customer_data['ClusterLabel'] == 'VIP' else (1 if customer_data['ClusterLabel'] == 'Regular' else 2),
                        segment=customer_data['ClusterLabel'],
                        pc1=0.0,
                        pc2=0.0
                    ))
                
                Customer.objects.bulk_create(customers_to_create, batch_size=500)
        
        return Response(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


# 🔹 Profile API
@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def profile(request):
    user = get_firebase_user(request)
    if not user:
        return Response({"error": "Unauthorized. Missing X-User-ID header."}, status=401)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Update user profile
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()
        
        # Update or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.company_name = request.data.get('company_name', profile.company_name)
        profile.phone = request.data.get('phone', profile.phone)
        profile.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)


# 🔹 Get Upload History (User-specific)
@api_view(['GET'])
@permission_classes([AllowAny])
def upload_history(request):
    """Get list of user's uploaded datasets"""
    user = get_firebase_user(request)
    if not user:
        return Response({"error": "Unauthorized. Missing X-User-ID header."}, status=401)
    datasets = UploadedDataset.objects.filter(user=user)[:10]  # Last 10 uploads
    data = [{
        'id': ds.id,
        'filename': ds.filename,
        'uploaded_at': ds.uploaded_at,
        'total_rows': ds.total_rows,
        'total_customers': ds.total_customers,
        'date_range': f"{ds.date_range_start.strftime('%Y-%m-%d') if ds.date_range_start else 'N/A'} to {ds.date_range_end.strftime('%Y-%m-%d') if ds.date_range_end else 'N/A'}"
    } for ds in datasets]
    return Response(data)


# 🔹 Get Customers by Segment (User-specific)
@api_view(['GET'])
@permission_classes([AllowAny])
def customers_by_segment(request, segment):
    """Get user's customers filtered by segment (VIP, Regular, At Risk)"""
    user = get_firebase_user(request)
    if not user:
        return Response({"error": "Unauthorized. Missing X-User-ID header."}, status=401)
    latest_dataset = UploadedDataset.objects.filter(user=user).last()
    
    if not latest_dataset:
        return Response({"error": "No data available"}, status=404)
    
    customers = Customer.objects.filter(
        dataset=latest_dataset,
        segment=segment
    ).values('customer_id', 'recency', 'frequency', 'monetary', 'segment')[:100]
    
    return Response(list(customers))
