import os
import re
import json
import shutil
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

MEDIA_ROOT = 'media'
DATA_DIR = 'data'
CONTENT_FILE = os.path.join(DATA_DIR, 'content.json')
ALLOWED_EXTENSIONS = {'.mp4', '.mkv', '.mov', '.webm', '.avi', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts'}
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'}


def read_content_file():
    try:
        if os.path.exists(CONTENT_FILE):
            with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return []


def write_content_file(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '_', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text or 'untitled'


def get_extension(filename):
    _, ext = os.path.splitext(filename)
    return ext.lower()


@app.route('/api/content', methods=['GET'])
def api_get_content():
    return jsonify(read_content_file())


@app.route('/api/content', methods=['POST'])
def api_save_content():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, list):
        return jsonify({'error': 'Expected a JSON array'}), 400
    write_content_file(data)
    return jsonify({'success': True, 'count': len(data)})


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/admin')
def admin():
    return send_from_directory('.', 'admin.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    title = request.form.get('title', 'Untitled').strip()
    content_type = request.form.get('type', 'movie').strip().lower()

    if not file.filename:
        return jsonify({'error': 'No filename'}), 400

    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'Unsupported format: {ext}. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    type_folder = {'movie': 'Movies', 'series': 'Web_Series', 'anime': 'Anime', 'trailer': 'Trailers'}.get(content_type, 'Movies')
    title_slug = slugify(title)
    folder_path = os.path.join(MEDIA_ROOT, type_folder, title_slug)
    os.makedirs(folder_path, exist_ok=True)

    safe_filename = f"{title_slug}{ext}"
    save_path = os.path.join(folder_path, safe_filename)
    file.save(save_path)

    url_path = f"/{save_path.replace(os.sep, '/')}"
    return jsonify({
        'success': True,
        'path': url_path,
        'folder': folder_path,
        'filename': safe_filename
    })


@app.route('/upload/image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    title = request.form.get('title', 'untitled').strip()
    image_type = request.form.get('imageType', 'thumbnail').strip().lower()

    if not file.filename:
        return jsonify({'error': 'No filename'}), 400

    ext = get_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({'error': f'Unsupported image format: {ext}'}), 400

    sub_folder = 'Banners' if image_type == 'banner' else 'Thumbnails'
    folder_path = os.path.join(MEDIA_ROOT, 'Images', sub_folder)
    os.makedirs(folder_path, exist_ok=True)

    title_slug = slugify(title)
    safe_filename = f"{title_slug}{ext}"
    save_path = os.path.join(folder_path, safe_filename)

    counter = 1
    while os.path.exists(save_path):
        safe_filename = f"{title_slug}_{counter}{ext}"
        save_path = os.path.join(folder_path, safe_filename)
        counter += 1

    file.save(save_path)
    url_path = f"/{save_path.replace(os.sep, '/')}"
    return jsonify({'success': True, 'path': url_path, 'filename': safe_filename})


def delete_local_file(url_path):
    """Delete a file from disk if it's a local /media/ path. Returns True if deleted."""
    if not url_path or not url_path.startswith('/media/'):
        return False
    rel_path = url_path.lstrip('/')
    abs_path = os.path.join(os.getcwd(), rel_path)
    if os.path.isfile(abs_path):
        os.remove(abs_path)
        parent = os.path.dirname(abs_path)
        try:
            if os.path.isdir(parent) and not os.listdir(parent):
                shutil.rmtree(parent)
        except Exception:
            pass
        return True
    return False


@app.route('/api/orphans', methods=['GET'])
def api_orphans():
    items = read_content_file()
    known_paths = set()
    for item in items:
        for field in ('videoUrl', 'trailerUrl'):
            p = item.get(field, '')
            if p:
                known_paths.add(p.lstrip('/'))

    VIDEO_FOLDERS = {
        'Movies': 'movie',
        'Web_Series': 'series',
        'Anime': 'anime',
    }
    VIDEO_EXTS = {'.mp4', '.mkv', '.mov', '.webm', '.avi', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts'}

    def deslugify(name):
        return name.replace('_', ' ').replace('-', ' ').title()

    orphans = []
    for folder_name, content_type in VIDEO_FOLDERS.items():
        folder_path = os.path.join(MEDIA_ROOT, folder_name)
        if not os.path.isdir(folder_path):
            continue
        for root, dirs, files in os.walk(folder_path):
            for fname in files:
                ext = os.path.splitext(fname)[1].lower()
                if ext not in VIDEO_EXTS:
                    continue
                abs_path = os.path.join(root, fname)
                rel_path = os.path.relpath(abs_path).replace(os.sep, '/')
                if rel_path in known_paths:
                    continue
                title = deslugify(os.path.splitext(fname)[0])
                orphans.append({
                    'id': f'orphan_{rel_path.replace("/", "_")}',
                    'title': title,
                    'type': content_type,
                    'videoUrl': '/' + rel_path,
                    'desc': 'This file was found in the media folder but has no content entry. You can register it from the Admin panel.',
                    'genre': 'Unknown',
                    'rating': '—',
                    'year': '—',
                    'tags': ['Uncategorized'],
                    'color': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1923 100%)',
                    'accent': '#6b7280',
                    'trending': False,
                    'newRelease': False,
                    '_orphan': True,
                })
    return jsonify(orphans)


@app.route('/api/content/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
    items = read_content_file()
    item = next((c for c in items if c.get('id') == content_id), None)
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    deleted_files = []
    for field in ('videoUrl', 'thumbnail', 'bannerUrl', 'trailerUrl'):
        path = item.get(field, '')
        if path and not path.startswith('data:'):
            if delete_local_file(path):
                deleted_files.append(path)

    updated = [c for c in items if c.get('id') != content_id]
    write_content_file(updated)
    return jsonify({'success': True, 'deleted_files': deleted_files})


@app.route('/media/<path:filepath>')
def serve_media(filepath):
    directory = os.path.join(os.getcwd(), MEDIA_ROOT)
    return send_from_directory(directory, filepath)


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    os.makedirs(os.path.join(MEDIA_ROOT, 'Images', 'Thumbnails'), exist_ok=True)
    os.makedirs(os.path.join(MEDIA_ROOT, 'Images', 'Banners'), exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
