from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('current-user/', views.current_user, name='current-user'),
    
    # Data operations
    path('upload/', views.upload_file, name='upload'),
    path('dashboard-data/', views.dashboard_data, name='dashboard-data'),
    path('profile/', views.profile, name='profile'),
    path('upload-history/', views.upload_history, name='upload-history'),
    path('customers/<str:segment>/', views.customers_by_segment, name='customers-by-segment'),
]
