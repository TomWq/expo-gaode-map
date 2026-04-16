import { image } from '@kit.ImageKit';
import { fileIo as fs } from '@kit.CoreFileKit';

export async function saveSnapshotToSandbox(tag: number, pixelMap: PixelMap): Promise<string> {
  const cacheDir = getContext().cacheDir;
  const filePath = `${cacheDir}/expo_gaode_map_snapshot_${tag}_${Date.now()}.jpg`;
  const packer = image.createImagePacker();
  const opts: image.PackingOption = { format: 'image/jpeg', quality: 95 };
  const file = fs.openSync(filePath, fs.OpenMode.CREATE | fs.OpenMode.READ_WRITE);

  try {
    await packer.packToFile(pixelMap, file.fd, opts);
  } finally {
    packer.release?.();
    fs.closeSync(file.fd);
  }

  return `file://${filePath}`;
}
