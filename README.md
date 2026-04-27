# The Segmentation Knight

## 📋 Overview

**The Segmentation Knight** is a powerful customer segmentation platform that uses machine learning to analyze retail transaction data and automatically categorize customers into actionable segments. Built with Django REST Framework and React, it provides real-time insights through interactive dashboards and advanced analytics.

### ✨ Key Features

- 🤖 **ML-Powered Segmentation**: Automatic customer clustering using K-Means, PCA, and RFM analysis
- 📊 **Interactive Dashboards**: Real-time visualizations with Recharts
- 👥 **Multi-User Support**: Secure authentication with user-specific data isolation
- 📈 **Advanced Analytics**: Top 10 insights, segment comparisons, and trend analysis
- 💾 **Historical Data**: View and compare multiple dataset analyses
- 📥 **Excel Export**: Download comprehensive reports in Excel format
- ⚡ **Smart Caching**: Redis-based caching for lightning-fast performance
- 🎨 **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 🎯 Customer Segments

The platform automatically identifies three key customer segments:

- **🌟 VIP Customers**: High-value, frequent buyers with recent purchases
- **💼 Regular Customers**: Moderate frequency and value, steady engagement
- **⚠️ At-Risk Customers**: Low engagement, older purchases, needs retention efforts

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/DeepenNehra/Retail-Customer-Segmentation.git
cd Retail-Customer-Segmentation
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5174
- Backend API: http://127.0.0.1:8000

## 📊 Data Format

Upload CSV files with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| InvoiceNo | Transaction ID | 536365 |
| InvoiceDate | Transaction timestamp | 2023-12-01 08:26:00 |
| CustomerID | Unique customer identifier | 17850 |
| Description | Product description | WHITE HANGING HEART T-LIGHT HOLDER |
| Quantity | Number of items | 6 |
| UnitPrice | Price per item | 2.55 |
| Country | Customer country | United Kingdom |

## 🏗️ Architecture

### Backend (Django)
- **Framework**: Django 5.2 + Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **ML Pipeline**: scikit-learn, pandas, numpy
- **Authentication**: Token-based authentication
- **Caching**: Django cache framework

### Frontend (React)
- **Framework**: React 18.3 + Vite
- **Routing**: React Router v6
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

### ML Pipeline
1. **Data Preprocessing**: Handle missing values, outliers
2. **RFM Analysis**: Calculate Recency, Frequency, Monetary metrics
3. **Feature Engineering**: Log transformation, standardization
4. **Dimensionality Reduction**: PCA for visualization
5. **Clustering**: K-Means with optimal cluster selection
6. **Validation**: Silhouette score analysis

## 📁 Project Structure

```
Retail-Customer-Segmentation/
├── backend/
│   ├── api/                    # Django app
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py     # DRF serializers
│   │   ├── ml_pipeline.py     # ML segmentation logic
│   │   └── urls.py            # API routes
│   ├── models/                # Trained ML models
│   │   ├── kmeans.pkl
│   │   ├── pca.pkl
│   │   └── scaler.pkl
│   ├── user_data/             # User-specific uploads
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── context/           # React context
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔐 Authentication

The platform uses token-based authentication:

1. **Register**: Create a new account with username, email, password
2. **Login**: Authenticate with username and password
3. **Token**: Receive authentication token
4. **Protected Routes**: All dashboard routes require authentication
5. **User Isolation**: Each user's data is completely separate

## 📈 API Endpoints

### Authentication
- `POST /api/register/` - Register new user
- `POST /api/login/` - Login user
- `POST /api/logout/` - Logout user
- `GET /api/current-user/` - Get current user info

### Data Operations
- `POST /api/upload/` - Upload dataset
- `GET /api/dashboard-data/` - Get dashboard analytics
- `GET /api/dashboard-data/?dataset_id=1` - Get specific dataset
- `GET /api/upload-history/` - Get upload history
- `GET /api/customers/<segment>/` - Get customers by segment
- `GET /api/profile/` - Get/update user profile

## 🎨 Features in Detail

### Dashboard
- **KPI Cards**: Total customers, active customers, average monetary, total revenue
- **2D PCA Visualization**: Customer clusters in 2D space
- **Monthly Sales Trend**: Revenue over time with seasonal patterns
- **Customer Table**: Searchable, filterable customer list with pagination

### Analytics
- **Segment Comparison**: Revenue and customer count by segment
- **CLV Distribution**: Customer lifetime value analysis
- **Average Metrics**: RFM averages by segment
- **Top 10 Insights**: Countries, products, and customers
- **Excel Export**: Multi-sheet comprehensive reports

### Profile
- **User Information**: Account details and statistics
- **Upload History**: All previous datasets with metadata
- **Historical Analysis**: View any previous dataset's analysis
- **Quick Actions**: Upload new data, refresh history

## 🚀 Deployment

**Ready to deploy?** Follow our quick start guide!

📖 **Deployment Guides:**
- **Quick Start** (10 minutes): See `QUICK_START_DEPLOYMENT.md`
- **Full Guide**: See `DEPLOYMENT.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Git Commands**: See `GIT_COMMANDS.md`

### Quick Deploy to Render

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DeepenNehra/Retail-Customer-Segmentation.git
git push -u origin main
```

2. **Deploy on Render**
   - Sign up at https://render.com
   - Connect your GitHub repository
   - Use `render.yaml` for automated deployment
   - Or follow manual setup in `DEPLOYMENT.md`

3. **Configure Environment Variables**
   - Backend: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
   - Frontend: `VITE_API_URL`

See detailed instructions in `QUICK_START_DEPLOYMENT.md`

### Render Deployment

1. **Prepare Backend**
```bash
# Add to requirements.txt
gunicorn==21.2.0
psycopg2-binary==2.9.9
whitenoise==6.6.0
```

2. **Update Settings**
```python
# backend/backend/settings.py
ALLOWED_HOSTS = ['*']  # Update with your domain
DATABASES = {
    'default': dj_database_url.config(default='sqlite:///db.sqlite3')
}
```

3. **Deploy on Render**
- Push code to GitHub
- Create new Web Service on Render
- Connect GitHub repository
- Configure build and start commands
- Add environment variables
- Deploy!

### Environment Variables
```
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

## 🧪 Testing

### Generate Test Data
Use the provided Gemini prompt to generate realistic test data:
- 100,000 transactions
- 4,000-5,000 customers
- Full year of data
- Realistic product names and prices
- Seasonal patterns

See `GEMINI_TEST_DATA_PROMPT.md` for details.

## 📊 Performance

- **Upload Processing**: 10-30 seconds for 100K rows
- **ML Pipeline**: 30-60 seconds for first analysis
- **Cached Views**: <1 second response time
- **Database**: Optimized with indexes
- **Frontend**: Code splitting and lazy loading

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Deepen Nehra**
- GitHub: [@DeepenNehra](https://github.com/DeepenNehra)
- Email: nehra7deepen5@gmail.com

## 🙏 Acknowledgments

- scikit-learn for ML algorithms
- Django REST Framework for API
- React and Recharts for visualization
- Tailwind CSS for styling
- Lucide for icons

## 📞 Support

For support, email nehra7deepen5@gmail.com or open an issue on GitHub.

---

<div align="center">
  <strong>Built with ❤️ by Deepen Nehra</strong>
</div>
