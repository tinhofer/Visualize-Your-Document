import { FileType } from '../types';

export const getFileType = (file: File): FileType => {
  if (file.type === 'application/pdf') return FileType.PDF;
  if (file.type === 'text/plain') return FileType.TXT;
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    file.name.endsWith('.docx')
  ) return FileType.DOCX;
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
    file.name.endsWith('.pptx')
  ) return FileType.PPTX;
  
  return FileType.UNKNOWN;
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};