# Object Detection using RestNet-101 Model
This project simulates the facial recognition software that searches through a database like shown in the movies.

It has a React front-end and a flask app in the back-end serving the requests.

The front end is deployed here on Github pages and the back-end on render.com

The back-end is configured with CORS to serve only the requests from this react front-end origin.

To implement this server-client simulation locally, follow the below instructions.

## 1. Clone the repository
```
git clone https://github.com/Nikhil-Kadapala/object-detector-resnet101.git

cd object-detector-resnet101
```

## 2. Install the dependencies

``` 
pip install -r requirements.txt
```

## 3. Start the server or Flask app using any of the below commands
```
python3 app.py
```
```
flask run
```
if your flask app is not named 'app.py', then run the below command
```
flask --app your_flask_app.py run
```

## 4. Start the React App
```
npm start
```

Inorder for this to work on the same machine you need to used different ports for the server and the client. Make sure you update the client and server URLs in the flask and react apps respectively.

The easiest way to test this setup is to run both ends in dev mode.

### On the server side, set the below environment variables before starting the server.
```
.\.venv\Scripts\activate
```
```
$env:FLASK_ENV="development"
```
### Run the below command to start the react app in dev mode
```
npm run dev
```
