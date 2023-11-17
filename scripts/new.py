import face_recognition
import json
import numpy as np
import os
import hashlib

file_name = "face_hashes.json"

# saves a new image to the json file
def main():
    img_encoding = create_face_encoding()

    face_hashes = load_face_hashes()

    save_face_info(face_hashes, img_encoding)

    hash = create_face_hash(img_encoding)
    print(hash)
    return hash

def create_face_encoding():
    new_img = face_recognition.load_image_file("image.jpeg")
    new_img_encoding = face_recognition.face_encodings(new_img)[0]
    return new_img_encoding

def load_face_hashes():
    loaded_array_of_arrays = []
    if os.path.exists(file_name) == False:
        return loaded_array_of_arrays
    
    with open(file_name, "r") as json_file:
        loaded_list = json.load(json_file)
        loaded_array_of_arrays = [np.array(lst) for lst in loaded_list]

    return loaded_array_of_arrays

def save_face_info(loaded_nparrays, face_encoding):
    loaded_nparrays.append(face_encoding)
    list_of_lists = [arr.tolist() for arr in loaded_nparrays]
    with open(file_name, "w") as json_file:
        json.dump(list_of_lists, json_file)

def create_face_hash(face_encoding):
    array_bytes = face_encoding.tobytes()

    hash_object = hashlib.sha256()
    hash_object.update(array_bytes)
    hash_hex = hash_object.hexdigest()

    return hash_hex
        


if __name__ == "__main__":
    main()