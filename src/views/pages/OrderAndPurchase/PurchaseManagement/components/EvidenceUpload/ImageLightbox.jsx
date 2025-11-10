import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

const ImageLightbox = ({ lightboxOpen, setLightboxOpen, lightboxIndex, getImageFiles }) => (
  <Lightbox
    open={lightboxOpen}
    close={() => setLightboxOpen(false)}
    index={lightboxIndex}
    slides={getImageFiles()}
    plugins={[Zoom, Thumbnails, Captions]}
    carousel={{
      spacing: 0,
      padding: 0,
      imageFit: "contain",
    }}
    zoom={{
      wheelZoomDistanceFactor: 100,
      pinchZoomDistanceFactor: 100,
      scrollToZoom: true,
    }}
    thumbnails={{
      position: "bottom",
      width: 120,
      height: 80,
      gap: 2,
      padding: 5,
    }}
    captions={{
      showToggle: true,
      descriptionTextAlign: "left",
    }}
  />
);

export default ImageLightbox;