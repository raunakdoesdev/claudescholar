import oloren as olo
import sys
import io
import json
import os

@olo.register()
def hello():
    return "Hello World!"



@olo.register()
def deploy(model = olo.Json(), log_message=print):
    bucket_ = model["url"].split("/")[2].split(".")[0]
    key_ = model["url"].split("/")[3].split("?")[0]
    name_ = str(hash(bucket_ + key_))
    print(bucket_, key_, name_)
    DISPATCHER_URL_ = log_message.dispatcher_url
    TOKEN_ = log_message.token
    cwd = os.getcwd()
    os.system(f"cp /detectron2modal.py {os.path.join(cwd, 'detectron2modal.py')}")
    # replace the strings into the file
    os.system(f"sed -i 's/bucket_/{bucket_}/g' {os.path.join(cwd, 'detectron2modal.py')}")
    os.system(f"sed -i 's/key_/{key_}/g' {os.path.join(cwd, 'detectron2modal.py')}")
    os.system(f"sed -i 's/DISPATCHER_URL_/{DISPATCHER_URL_}/g' {os.path.join(cwd, 'detectron2modal.py')}")
    os.system(f"sed -i 's/TOKEN_/{TOKEN_}/g' {os.path.join(cwd, 'detectron2modal.py')}")
    os.system(f"sed -i 's/name_/{name_}/g' {os.path.join(cwd, 'detectron2modal.py')}")
    
    os.system(f"modal deploy detectron2modal.py")
    print(bucket_, key_, name_)
    return name_

@olo.register()
def run(image = olo.File(), name = olo.String()):
    import modal
    
    f = modal.Function.lookup(f"run-detectron-{name}", "Detectron2.predict")
    
    with open(image, "rb") as f_:
        img_data_in = f_.read()
        
    results = f.call(img_data_in)
    print(results)
    return results

if __name__ == "__main__":
    olo.run("detectron2deploy", port=80)