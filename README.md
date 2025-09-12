# SIH - Smart India Hackathon Project

A Flask-based web application for product compliance monitoring and analysis.

## Features

- Product data analysis and compliance checking
- Machine learning model for compliance prediction
- Web interface for data visualization
- OCR capabilities for product label processing

## Project Structure

```
├── app.py                 # Main Flask application
├── app_explained.py       # Detailed version with explanations
├── pipeline.py           # Data processing pipeline
├── train_model.py        # Model training script
├── scraper_ocr.py        # OCR functionality
├── snapdeal_mock.py      # Mock data generator
├── compliance_model.pkl  # Trained ML model
├── results.csv          # Product data
├── static/              # CSS and JavaScript files
├── templates/           # HTML templates
└── sample images/       # Test images for OCR

```

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SIH.git
cd SIH
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install flask pandas joblib scikit-learn opencv-python pytesseract
```

4. Run the application:
```bash
python app.py
```

## Usage

1. Start the Flask server
2. Navigate to `http://localhost:5000` in your browser
3. Use the web interface to analyze product compliance data

## Technologies Used

- **Backend**: Flask, Python
- **Machine Learning**: scikit-learn, pandas
- **Frontend**: HTML, CSS, JavaScript
- **OCR**: Tesseract, OpenCV
- **Data Processing**: pandas, joblib

## Contributing

This project was developed for Smart India Hackathon. Feel free to contribute by submitting issues or pull requests.
