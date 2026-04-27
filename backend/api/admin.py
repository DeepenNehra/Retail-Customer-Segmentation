from django.contrib import admin
from .models import UploadedDataset, Customer, SegmentationResult

@admin.register(UploadedDataset)
class UploadedDatasetAdmin(admin.ModelAdmin):
    list_display = ['filename', 'uploaded_at', 'total_rows', 'total_customers', 'date_range_start', 'date_range_end']
    list_filter = ['uploaded_at']
    search_fields = ['filename']
    readonly_fields = ['uploaded_at']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'segment', 'recency', 'frequency', 'monetary', 'dataset', 'created_at']
    list_filter = ['segment', 'dataset', 'created_at']
    search_fields = ['customer_id']
    readonly_fields = ['created_at']
    ordering = ['-monetary']

@admin.register(SegmentationResult)
class SegmentationResultAdmin(admin.ModelAdmin):
    list_display = ['dataset', 'total_customers', 'vip_count', 'regular_count', 'at_risk_count', 'total_revenue', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
