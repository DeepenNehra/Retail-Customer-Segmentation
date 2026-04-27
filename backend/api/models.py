from django.db import models
from django.contrib.auth.models import User

class UploadedDataset(models.Model):
    """Stores metadata about uploaded datasets"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='datasets', null=True, blank=True)
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_rows = models.IntegerField()
    total_customers = models.IntegerField()
    date_range_start = models.DateTimeField(null=True, blank=True)
    date_range_end = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.filename} - {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"


class Customer(models.Model):
    """Stores individual customer RFM data and segment"""
    dataset = models.ForeignKey(UploadedDataset, on_delete=models.CASCADE, related_name='customers')
    customer_id = models.CharField(max_length=50)
    recency = models.IntegerField(help_text="Days since last purchase")
    frequency = models.IntegerField(help_text="Number of distinct orders")
    monetary = models.FloatField(help_text="Total revenue from customer")
    cluster = models.IntegerField(help_text="Cluster number (0, 1, 2)")
    segment = models.CharField(max_length=50, help_text="VIP, Regular, or At Risk")
    pc1 = models.FloatField(help_text="First principal component")
    pc2 = models.FloatField(help_text="Second principal component")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-monetary']
        indexes = [
            models.Index(fields=['customer_id']),
            models.Index(fields=['segment']),
            models.Index(fields=['dataset']),
        ]
    
    def __str__(self):
        return f"Customer {self.customer_id} - {self.segment}"


class SegmentationResult(models.Model):
    """Stores aggregated segmentation statistics"""
    dataset = models.OneToOneField(UploadedDataset, on_delete=models.CASCADE, related_name='result')
    total_customers = models.IntegerField()
    active_customers = models.IntegerField()
    avg_monetary = models.FloatField()
    total_revenue = models.FloatField()
    vip_count = models.IntegerField(default=0)
    regular_count = models.IntegerField(default=0)
    at_risk_count = models.IntegerField(default=0)
    silhouette_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Results for {self.dataset.filename}"


class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
