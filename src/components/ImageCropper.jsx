import { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import setCanvasPreview from "../setCanvasPreview";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 100;

const ImageCropper = ({ closeModal, updateAvatar }) => {
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(0);

  const rotateImage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save the unrotated context of the canvas so we can restore it later
    ctx.save();

    // Move registration point to the center of the canvas
    ctx.translate(width / 2, height / 2);

    // Rotate the canvas to the specified degrees
    ctx.rotate((rotation * Math.PI) / 180);

    // Move registration point back to the top left corner of canvas
    ctx.translate(-width / 2, -height / 2);

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Restore the context to the unrotated state
    ctx.restore();

    // Convert the canvas to a data URL and update the imgSrc state
    const dataUrl = canvas.toDataURL();
    setImgSrc(dataUrl);

    // Update the rotation state
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 5) {
      // 1 MB = 1024 * 1024 bytes
      // setError("Image size must be less than 1 MB.");
      toast.error("Image size must be less than 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (e) => {
        if (error) setError("");
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          setError("Image must be at least 150 x 150 pixels.");
          return setImgSrc("");
        }
      });
      setImgSrc(imageUrl);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);

    // if (imgRef.current) {
    //   imgRef.current.style.transform = `rotate(${rotation}deg)`;
    // }
  };

  // useEffect(() => {
  //   if (imgRef.current) {
  //     onImageLoad({ currentTarget: imgRef.current });
  //   }
  // }, [rotation]);

  useEffect(() => {
    if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current });
    }
  }, [imgSrc]);

  return (
    <>
      <Toaster />
      <label className="block mb-3 w-fit">
        <span className="sr-only">Choose profile photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
        />
      </label>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {imgSrc && (
        <div className="flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
            circularCrop={false}
            keepSelection
            aspect={ASPECT_RATIO}
            minWidth={MIN_DIMENSION}
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Upload"
              style={{ maxHeight: "70vh" }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <button
            className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 bg-sky-500 hover:bg-sky-600"
            onClick={rotateImage}
          >
            Rotate Image
          </button>
          <button
            className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 bg-sky-500 hover:bg-sky-600"
            onClick={() => {
              setCanvasPreview(
                imgRef.current, // HTMLImageElement
                previewCanvasRef.current, // HTMLCanvasElement
                convertToPixelCrop(
                  crop,
                  imgRef.current.width,
                  imgRef.current.height
                )
              );
              const dataUrl = previewCanvasRef.current.toDataURL();
              updateAvatar(dataUrl);
              closeModal();
            }}
          >
            Crop Image
          </button>
        </div>
      )}
      {crop && (
        <canvas
          ref={previewCanvasRef}
          className="mt-4"
          style={{
            display: "none",
            border: "1px solid black",
            objectFit: "contain",
            width: 150,
            height: 150,
          }}
        />
      )}
    </>
  );
};
export default ImageCropper;
