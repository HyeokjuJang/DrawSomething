from flask import Flask, render_template, request, jsonify, send_from_directory
from static.model_autoencoder.generate_image_by_class import *
import os

app = Flask(__name__)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/resource'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/sketch")
def sketch():
    return render_template('sketch.html')

@app.route("/speed_draw")
def speed_draw():
    return render_template('speed_draw.html')

@app.route("/guess_draw")
def guess_draw():
    return render_template('guess_draw.html')

@app.route("/draw_together")
def draw_together():
    return render_template('draw_together.html')

@app.route("/about")
def about():
    return render_template('about.html')

# model list : aaron_sheep, catbus, elephantpig, flamingo, owl
@app.route("/auto",methods=['GET'])
def autoEncoderGenerateImage():
    model = request.args.get("model")
    svg_arr = generateImageByClass(model, temperature=0.8, draw_mode=False)

    # It's temporary folder to test it
    # It will be saved at temp folder
    if not os.path.exists("./temp"):
        os.makedirs("./temp")
    draw_strokes(svg_arr, factor=0.2, svg_filename = './temp/image.svg')

    return str(svg_arr)

if __name__ == '__main__':
    app.run()