import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.metrics import silhouette_score
import joblib
import os

def remove_outliers_iqr(data, column):
    """Remove outliers using IQR method"""
    Q1 = data[column].quantile(0.25)
    Q3 = data[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    return data[(data[column] >= lower) & (data[column] <= upper)]

def run_pipeline(df):
    """
    Complete ML pipeline exactly as implemented in Colab
    """
    
    # ========== DATA CLEANING ==========
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Drop missing Description
    df = df.dropna(subset=['Description'])
    
    # Handle missing CustomerID
    df = df[df['CustomerID'].notnull()]
    
    # Remove negative Quantity (cancelled orders)
    df = df[df['Quantity'] > 0]
    df = df[df['UnitPrice'] > 0]
    
    # Remove outliers using IQR
    df = remove_outliers_iqr(df, 'Quantity')
    df = remove_outliers_iqr(df, 'UnitPrice')
    
    # ========== FEATURE ENGINEERING ==========
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    
    # ========== TOP COUNTRIES ANALYSIS ==========
    top_countries = df.groupby('Country')['TotalPrice'].sum().sort_values(ascending=False).head(10)
    top_countries_data = [{"country": country, "revenue": float(revenue)} for country, revenue in top_countries.items()]
    
    # ========== TOP PRODUCTS ANALYSIS ==========
    product_analysis = df.groupby('Description').agg({
        'Quantity': 'sum',
        'TotalPrice': 'sum',
        'UnitPrice': 'mean'
    }).sort_values(by='Quantity', ascending=False).head(10)
    
    top_products_quantity = [
        {"product": prod, "quantity": int(row['Quantity']), "revenue": float(row['TotalPrice'])} 
        for prod, row in product_analysis.iterrows()
    ]
    
    # ========== MONTHLY SALES TREND ==========
    df['Month'] = df['InvoiceDate'].dt.to_period('M')
    monthly_sales = df.groupby('Month')['TotalPrice'].sum()
    monthly_sales_data = [
        {"month": str(month), "revenue": float(revenue)} 
        for month, revenue in monthly_sales.items()
    ]
    
    # ========== TOP CUSTOMERS ==========
    top_customers = df.groupby('CustomerID')['TotalPrice'].sum().sort_values(ascending=False).head(10)
    top_customers_data = [
        {"customer_id": str(int(cust_id)), "total_spent": float(spent)} 
        for cust_id, spent in top_customers.items()
    ]
    
    # ========== RFM ANALYSIS ==========
    reference_date = df['InvoiceDate'].max()
    
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (reference_date - x.max()).days,
        'InvoiceNo': 'nunique',  # Count unique invoices
        'TotalPrice': 'sum'
    })
    
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    rfm = rfm.reset_index()
    
    # ========== LOG TRANSFORMATION ==========
    rfm['Recency'] = np.log1p(rfm['Recency'])
    rfm['Frequency'] = np.log1p(rfm['Frequency'])
    rfm['Monetary'] = np.log1p(rfm['Monetary'])
    
    # ========== REMOVE OUTLIERS ==========
    rfm = rfm[
        (rfm['Monetary'] < rfm['Monetary'].quantile(0.99)) &
        (rfm['Frequency'] < rfm['Frequency'].quantile(0.99))
    ]
    
    # ========== SCALING ==========
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm[['Recency', 'Frequency', 'Monetary']])
    
    # ========== OUTLIER REMOVAL WITH ISOLATION FOREST ==========
    iso = IsolationForest(contamination=0.05, random_state=42)
    outliers = iso.fit_predict(rfm_scaled)
    
    rfm_clean = rfm[outliers == 1].copy()
    rfm_scaled_clean = rfm_scaled[outliers == 1]
    
    # ========== PCA ==========
    pca = PCA(n_components=2)
    rfm_pca = pca.fit_transform(rfm_scaled_clean)
    
    pca_variance = pca.explained_variance_ratio_
    
    # ========== K-MEANS CLUSTERING ==========
    kmeans = KMeans(n_clusters=3, init='k-means++', random_state=42, n_init=10)
    rfm_clean['Cluster'] = kmeans.fit_predict(rfm_pca)
    
    # ========== SILHOUETTE SCORE ==========
    silhouette = silhouette_score(rfm_pca, rfm_clean['Cluster'])
    
    # ========== CLUSTER LABELING ==========
    # Analyze clusters and assign labels based on RFM values
    cluster_summary = rfm_clean.groupby('Cluster')[['Recency', 'Frequency', 'Monetary']].mean()
    
    # Sort by Monetary (highest = VIP)
    sorted_clusters = cluster_summary.sort_values('Monetary', ascending=False)
    
    # Convert numpy.int32 keys to Python int
    cluster_map = {
        int(sorted_clusters.index[0]): "VIP",
        int(sorted_clusters.index[1]): "Regular",
        int(sorted_clusters.index[2]): "At Risk"
    }
    
    rfm_clean['Segment'] = rfm_clean['Cluster'].map(cluster_map)
    
    # ========== SAVE MODELS ==========
    os.makedirs('models', exist_ok=True)
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(pca, 'models/pca.pkl')
    joblib.dump(kmeans, 'models/kmeans.pkl')
    
    # ========== PREPARE OUTPUT DATA ==========
    rfm_clean['PC1'] = rfm_pca[:, 0]
    rfm_clean['PC2'] = rfm_pca[:, 1]
    
    # Statistics
    total_customers = int(rfm_clean['CustomerID'].nunique())
    active_customers = int(
        rfm_clean[rfm_clean['Segment'] == 'VIP']['CustomerID'].nunique() + 
        rfm_clean[rfm_clean['Segment'] == 'Regular']['CustomerID'].nunique()
    )
    
    # Convert back from log scale
    avg_monetary = float(np.expm1(rfm_clean['Monetary'].mean()))
    total_revenue = float(np.expm1(rfm_clean['Monetary']).sum())
    
    # Convert cluster_dist values to Python int
    cluster_dist = {str(k): int(v) for k, v in rfm_clean['Segment'].value_counts().to_dict().items()}
    
    stats = {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "avg_monetary": avg_monetary,
        "total_revenue": total_revenue,
        "cluster_dist": cluster_dist,
        "silhouette_score": float(silhouette),
        "pca_variance_explained": [float(v) for v in pca_variance],
        "total_variance_retained": float(sum(pca_variance))
    }
    
    # PCA scatter data
    pca_arr = []
    for _, row in rfm_clean.iterrows():
        pca_arr.append({
            "x": float(row['PC1']),
            "y": float(row['PC2']),
            "label": row['Segment']
        })
    
    # Elbow curve data
    elbow = []
    max_k = min(10, len(rfm_scaled_clean))
    if max_k > 2:
        for k in range(1, max_k):
            km = KMeans(n_clusters=k, init='k-means++', random_state=42, n_init=10)
            km.fit(rfm_scaled_clean)
            elbow.append({"k": k, "inertia": float(km.inertia_)})
    
    # RFM distribution
    monetary_original = np.expm1(rfm_clean['Monetary'])
    hist, bin_edges = np.histogram(monetary_original, bins=10)
    rfm_distribution = {"monetary": []}
    for i in range(len(hist)):
        from_val = int(bin_edges[i])
        to_val = int(bin_edges[i+1])
        rfm_distribution["monetary"].append({
            "range": f"{from_val}-{to_val}",
            "count": int(hist[i])
        })
    
    # Customer list
    customers = []
    for _, row in rfm_clean.iterrows():
        customers.append({
            "CustomerID": str(int(row['CustomerID'])),
            "Recency": int(np.expm1(row['Recency'])),
            "Frequency": int(np.expm1(row['Frequency'])),
            "Monetary": float(np.expm1(row['Monetary'])),
            "ClusterLabel": row['Segment']
        })
    
    # Cluster count data
    cluster_counts = rfm_clean['Segment'].value_counts().to_dict()
    cluster_count_data = [{"segment": seg, "count": int(count)} for seg, count in cluster_counts.items()]
    
    return {
        "stats": stats,
        "pca": pca_arr,
        "elbow": elbow,
        "rfm_distribution": rfm_distribution,
        "label_map": cluster_map,
        "customers": customers,
        "top_countries": top_countries_data,
        "top_products": top_products_quantity,
        "monthly_sales": monthly_sales_data,
        "top_customers": top_customers_data,
        "cluster_counts": cluster_count_data
    }