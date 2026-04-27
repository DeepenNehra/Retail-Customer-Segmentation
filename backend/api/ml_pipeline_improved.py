import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.metrics import silhouette_score
import joblib
import os

def remove_outliers_iqr(df, column):
    """Remove outliers using IQR method"""
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    return df[(df[column] >= lower) & (df[column] <= upper)]


def run_pipeline(df):
    """
    Improved ML pipeline combining Colab best practices with production API structure
    """
    
    # ========== DATA CLEANING (FROM COLAB) ==========
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Remove invalid data
    df = df[df['Quantity'] > 0]
    df = df[df['UnitPrice'] > 0]
    df = df[df['CustomerID'].notna()]
    
    # Remove outliers using IQR method
    df = remove_outliers_iqr(df, 'Quantity')
    df = remove_outliers_iqr(df, 'UnitPrice')
    
    # ========== FEATURE ENGINEERING ==========
    
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    
    snapshot = df['InvoiceDate'].max()
    
    # ========== RFM CALCULATION (IMPROVED) ==========
    
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (snapshot - x.max()).days,
        'InvoiceNo': 'nunique',  # ← Fixed: Count UNIQUE invoices, not line items
        'TotalPrice': 'sum'
    })
    
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    
    # ========== LOG TRANSFORMATION (FROM COLAB) ==========
    
    rfm['Recency'] = np.log1p(rfm['Recency'])
    rfm['Frequency'] = np.log1p(rfm['Frequency'])
    rfm['Monetary'] = np.log1p(rfm['Monetary'])
    
    # ========== SCALING ==========
    
    scaler = StandardScaler()
    scaled = scaler.fit_transform(rfm)
    
    # ========== OUTLIER REMOVAL ==========
    
    iso = IsolationForest(contamination=0.05, random_state=42)  # Increased from 0.02 to match Colab
    mask = iso.fit_predict(scaled)
    
    rfm_clean = rfm[mask == 1].copy()
    scaled_clean = scaled[mask == 1]
    
    # ========== K-MEANS CLUSTERING ==========
    
    kmeans = KMeans(n_clusters=3, init='k-means++', random_state=42, n_init=10)
    rfm_clean['Cluster'] = kmeans.fit_predict(scaled_clean)
    
    # ========== CLUSTER LABELING ==========
    
    # Calculate cluster centroids to intelligently assign labels
    cluster_summary = rfm_clean.groupby('Cluster')[['Recency', 'Frequency', 'Monetary']].mean()
    
    # Sort by Monetary (highest = VIP)
    sorted_clusters = cluster_summary.sort_values('Monetary', ascending=False)
    
    cluster_map = {
        sorted_clusters.index[0]: "VIP",
        sorted_clusters.index[1]: "Regular",
        sorted_clusters.index[2]: "At Risk"
    }
    
    rfm_clean['Segment'] = rfm_clean['Cluster'].map(cluster_map)
    
    # ========== SILHOUETTE SCORE (FROM COLAB) ==========
    
    silhouette = silhouette_score(scaled_clean, rfm_clean['Cluster'])
    
    # ========== PCA FOR VISUALIZATION ==========
    
    pca = PCA(n_components=2)
    pca_data_res = pca.fit_transform(scaled_clean)
    
    rfm_clean['PC1'] = pca_data_res[:, 0]
    rfm_clean['PC2'] = pca_data_res[:, 1]
    
    rfm_clean = rfm_clean.reset_index()
    
    # ========== SAVE MODELS (FROM COLAB) ==========
    
    os.makedirs('models', exist_ok=True)
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(kmeans, 'models/kmeans.pkl')
    joblib.dump(pca, 'models/pca.pkl')
    
    # ========== STATISTICS ==========
    
    total_customers = int(rfm_clean['CustomerID'].nunique())
    active_customers = int(
        rfm_clean[rfm_clean['Segment'] == 'VIP']['CustomerID'].nunique() + 
        rfm_clean[rfm_clean['Segment'] == 'Regular']['CustomerID'].nunique()
    )
    
    # Convert back from log scale for display
    avg_monetary = float(np.expm1(rfm_clean['Monetary'].mean()))
    total_revenue = float(np.expm1(rfm_clean['Monetary']).sum())
    
    cluster_dist = rfm_clean['Segment'].value_counts().to_dict()
    
    stats = {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "avg_monetary": avg_monetary,
        "total_revenue": total_revenue,
        "cluster_dist": cluster_dist,
        "silhouette_score": float(silhouette),  # ← NEW!
        "pca_variance": float(sum(pca.explained_variance_ratio_))  # ← NEW!
    }
    
    # ========== PCA ARRAY ==========
    
    pca_arr = []
    for _, row in rfm_clean.iterrows():
        pca_arr.append({
            "x": float(row['PC1']),
            "y": float(row['PC2']),
            "label": row['Segment']
        })
    
    # ========== ORDERS OVER TIME ==========
    
    df['MonthYear'] = df['InvoiceDate'].dt.to_period('M')
    monthly_orders = df.groupby(df['MonthYear'].astype(str))['InvoiceNo'].nunique().reset_index()
    orders_over_time = [
        {"month": str(row['MonthYear']), "orders": int(row['InvoiceNo'])} 
        for _, row in monthly_orders.iterrows()
    ]
    
    # ========== ELBOW CURVE ==========
    
    elbow = []
    max_k = min(10, len(scaled_clean))
    if max_k > 2:
        for k in range(1, max_k):
            km = KMeans(n_clusters=k, init='k-means++', random_state=42)
            km.fit(scaled_clean)
            elbow.append({"k": k, "inertia": float(km.inertia_)})
    
    # ========== RFM DISTRIBUTION ==========
    
    # Use original scale for distribution
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
    
    # ========== CUSTOMER LIST ==========
    
    customers = []
    for _, row in rfm_clean.iterrows():
        customers.append({
            "CustomerID": str(row['CustomerID']),
            "Recency": int(np.expm1(row['Recency'])),  # Convert back from log
            "Frequency": int(np.expm1(row['Frequency'])),
            "Monetary": float(np.expm1(row['Monetary'])),
            "ClusterLabel": row['Segment']
        })
    
    # ========== RETURN RESULTS ==========
    
    return {
        "stats": stats,
        "pca": pca_arr,
        "orders_over_time": orders_over_time,
        "elbow": elbow,
        "rfm_distribution": rfm_distribution,
        "label_map": cluster_map,
        "customers": customers
    }
