import face_recognition
import hashlib
import json
import numpy as np
import os

file_name = "face_hashes.json"

# find an image and return the hash if it is recognized
def main():
    face_encodings = load_face_encodings()

    new_img = face_recognition.load_image_file("image_new.jpeg")
    new_img_encoding = face_recognition.face_encodings(new_img)

    face_found = find_face(face_encodings, new_img_encoding)
    if face_found == None:
        print("face not found")
        return

    print(face_found)
    
    return face_found

def create_face_encoding():
    new_img = face_recognition.load_image_file("image.jpeg")
    new_img_encoding = face_recognition.face_encodings(new_img)[0]
    return new_img_encoding

def load_face_encodings():
    loaded_array_of_arrays = []
    if os.path.exists(file_name) == False:
        return loaded_array_of_arrays
    
    with open(file_name, "r") as json_file:
        loaded_list = json.load(json_file)
        loaded_array_of_arrays = [np.array(lst) for lst in loaded_list]
        
    return loaded_array_of_arrays

def find_face(face_encodings, new_img_encoding):
    for face_encoding in face_encodings:
        match_results = face_recognition.compare_faces([face_encoding], new_img_encoding[0])
        if match_results[0]:
            return create_face_hash(face_encoding)
        
    return None

def create_face_hash(face_encoding):
    array_bytes = face_encoding.tobytes()

    hash_object = hashlib.sha256()
    hash_object.update(array_bytes)
    hash_hex = hash_object.hexdigest()

    return hash_hex
        
if __name__ == "__main__":
    main()