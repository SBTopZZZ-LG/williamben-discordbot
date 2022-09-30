import sys
import cv2

if len(sys.argv) == 1:
    print("Error: Arguments required!", file=sys.stderr)
    exit(-1)

CAT_FACE_CASCADE_XML = "C:/Users/SBTOPZZZ-PC/Documents/haarcascade_frontalcatface.xml"
CAT_IMAGE = ' '.join(sys.argv[1:])

catFaceCascade = cv2.CascadeClassifier(CAT_FACE_CASCADE_XML)
image = cv2.imread(CAT_IMAGE)
faces = catFaceCascade.detectMultiScale(image)

code = 1 if len(faces) > 0 else 0
print(code)
