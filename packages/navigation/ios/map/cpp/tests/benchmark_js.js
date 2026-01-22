
const parsePolylineJS = (polylineStr) => {
  if (!polylineStr || typeof polylineStr !== 'string') return [];
  try {
    const points = polylineStr.split(';');
    return points.map(point => {
      const [lng, lat] = point.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
  } catch (error) {
    return [];
  }
};

const benchmark = () => {
  console.log("Running JS benchmark (10,000 points)...");
  
  // 生成 10,000 个点的测试字符串
  let largePoly = "";
  for (let i = 0; i < 10000; i++) {
    largePoly += "116.4074,39.9042;";
  }

  const start = Date.now();
  
  // 运行 100 次以获得更准确的平均值
  for (let i = 0; i < 100; i++) {
    const result = parsePolylineJS(largePoly);
    if (result.length !== 10000) {
      console.error(`Error: Expected 10000 points, got ${result.length}`);
    }
  }
  
  const end = Date.now();
  const totalTime = end - start;
  
  console.log(`Total time for 100 iterations: ${totalTime} ms`);
  console.log(`Average time per parse (10,000 points): ${totalTime / 100} ms`);
};

benchmark();
