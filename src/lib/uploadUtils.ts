import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File) => {
  // If it's not an image (e.g. video) or it's a gif, don't compress
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' // Convert to WebP for better web compatibility and size
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Erro na compressão da imagem:", error);
    // Return original file if compression fails
    return file;
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
