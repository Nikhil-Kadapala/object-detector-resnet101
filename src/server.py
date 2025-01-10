import os
from flask import Flask, request, render_template, redirect, url_for
from flask_cors import CORS
import json
import matplotlib.pyplot as plt
import torch
from PIL import Image
from torchvision import transforms, models
from torchvision.models import resnet101, ResNet101_Weights

def transform_image(image):
    image = Image.open(image)
    Transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return Transform(image)

def get_classes():
    with open("classes.txt", "r") as f:
        classes = [line.strip() for line in f.readlines()]
    return classes

def predict_class(image):
    image = transform_image(image)
    batched_img = image.unsqueeze(0)
    weights = ResNet101_Weights.IMAGENET1K_V1
    model = resnet101(weights=weights)
    with torch.no_grad():
        model.eval()
        output = model(batched_img)
        classes = get_classes()
        _, pred = torch.max(output, dim=1)
        prob = torch.softmax(output, dim=1)[0] * 100
        print(classes[pred])
        return classes[pred], prob[pred].item() 



app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET', 'POST'])

def upload_file():
    if request.method == 'POST':
        print(request.files)
        file = request.files['image']
        file.save('uploaded_image.jpg')
        category, probability = predict_class('uploaded_image.jpg')
        cats = category[0]
        print(cats[0])
        data = {'category': category, 'probability': probability, 'stopSlideshow': True}
        print(data)
        return json.dumps(data)

if __name__ == '__main__':
    app.run(debug=True)
