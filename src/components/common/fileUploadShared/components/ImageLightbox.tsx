import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';

import type { LightboxSlide } from '../types';

type ImageLightboxProps = {
  lightboxOpen: boolean;
  setLightboxOpen: (open: boolean) => void;
  lightboxIndex: number;
  setLightboxIndex?: (index: number) => void;
  getImageFiles: () => LightboxSlide[];
};

const ImageLightbox = ({
  lightboxOpen,
  setLightboxOpen,
  lightboxIndex,
  setLightboxIndex: _setLightboxIndex,
  getImageFiles,
}: ImageLightboxProps) => (
  <Lightbox
    open={lightboxOpen}
    close={() => setLightboxOpen(false)}
    index={lightboxIndex}
    slides={getImageFiles()}
    plugins={[Zoom, Thumbnails, Captions]}
    carousel={{
      spacing: 0,
      padding: 0,
      imageFit: 'contain',
    }}
    zoom={{
      wheelZoomDistanceFactor: 100,
      pinchZoomDistanceFactor: 100,
      scrollToZoom: true,
    }}
    thumbnails={{
      position: 'bottom',
      width: 120,
      height: 80,
      gap: 2,
      padding: 5,
    }}
    captions={{
      showToggle: true,
      descriptionTextAlign: 'start',
    }}
  />
);

export default ImageLightbox;
