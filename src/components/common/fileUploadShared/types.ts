export type PreviewableFile = {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  preview?: string | null;
  file?: File;
};

export type LightboxSlide = {
  src: string;
  title?: string;
  description?: string;
};
