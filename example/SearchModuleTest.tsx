import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, FlatList } from 'react-native';

// 尝试加载搜索模块
import * as SearchModule from 'expo-gaode-map';

export default function SearchModuleTest() {
  const [log, setLog] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('餐厅');
  const [city, setCity] = useState('北京');
  const [tips, setTips] = useState<SearchModule.InputTip[]>([]);
  const [showTips, setShowTips] = useState(false);


  const addLog = (message: string) => {
    console.log('[SearchModuleTest]', message);
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testModuleLoad = () => {
    console.log('[SearchModuleTest] testModuleLoad 被调用');
    addLog('═══ 测试搜索模块加载 ═══');
    
    try {
   
      console.log('[SearchModuleTest] loadSearch 返回:', SearchModule);
      
      if (SearchModule) {
        addLog('✅ 搜索模块加载成功!');
        addLog(`📦 导出的方法: ${Object.keys(SearchModule).join(', ')}`);
        return true;
      } else {
        addLog('❌ 搜索模块加载失败');
        addLog('原因可能是:');
        addLog('1. 原生代码未编译 - 需要运行 expo prebuild');
        addLog('2. 模块未正确链接');
        addLog('3. Gradle 配置问题');
        return false;
      }
    } catch (error) {
      console.error('[SearchModuleTest] 加载模块出错:', error);
      addLog(`❌ 加载出错: ${error}`);
      return false;
    }
  };

  const testPOISearch = async () => {
    console.log('[SearchModuleTest] testPOISearch 被调用');
    addLog('═══ 测试 POI 搜索 ═══');
   
    
    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      addLog(`🔍 搜索关键词: ${keyword}`);
      addLog(`📍 搜索城市: ${city}`);
      
      const result = await SearchModule.searchPOI({
        keyword,
        city,
        pageSize: 10,
        pageNum: 1,
      });
      
      addLog(`✅ 搜索成功!`);
      addLog(`📊 总数: ${result.total}`);
      addLog(`📍 结果数: ${result.pois.length}`);
      
      result.pois.slice(0, 3).forEach((poi: SearchModule.POI, index: number) => {
        addLog(`${index + 1}. ${poi.name}`);
        addLog(`   地址: ${poi.address || '无'}`);
        if (poi.location?.latitude && poi.location?.longitude) {
          addLog(`   坐标: ${poi.location.latitude.toFixed(4)}, ${poi.location.longitude.toFixed(4)}`);
        } else {
          addLog(`   坐标: 暂无`);
        }
        
        if (poi.photos && poi.photos?.length > 0) {
          addLog(`   图片: ${poi.photos[0].title || '无'}`);
        } else {
          addLog(`   图片: 暂无`);
        }
        
        if (poi.indoor) {
          addLog(`   indoor: 有: ${poi.indoor.floorName || '无'}`);
        } else {
          addLog(`   indoor: 无`);
        }
        if (poi.business) {
          addLog(`   business: 有: ${poi.business.tag || '无'}`);
        } else {
          addLog(`   business: 无`);
        }
      });
      
    } catch (error) {
      console.error('[SearchModuleTest] 搜索出错:', error);
      addLog(`❌ 搜索失败: ${error}`);
    }
  };

  const testNearbySearch = async () => {
    console.log('[SearchModuleTest] testNearbySearch 被调用');
    addLog('═══ 测试周边搜索 ═══');
   
    
    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      addLog(`🔍 搜索关键词: ${keyword}`);
      addLog(`📍 中心点: 北京天安门 (39.9, 116.4)`);
      addLog(`📏 半径: 1000米`);
      
      const result = await SearchModule.searchNearby({
        keyword,
        center: { latitude: 39.9, longitude: 116.4 },
        radius: 1000,
        pageSize: 10,
        pageNum: 1,
      });
      
      addLog(`✅ 搜索成功!`);
      addLog(`📊 总数: ${result.total}`);
      addLog(`📍 结果数: ${result.pois.length}`);
      
      result.pois.slice(0, 3).forEach((poi: SearchModule.POI, index: number) => {
        addLog(`${index + 1}. ${poi.name}`);
        addLog(`   距离: ${poi.distance || 0}米`);
      });
      
    } catch (error) {
      console.error('[SearchModuleTest] 周边搜索出错:', error);
      addLog(`❌ 搜索失败: ${error}`);
    }
  };

  // 实时获取输入提示
  const fetchInputTips = async (text: string) => {
    if (!text || text.length < 2) {
      setTips([]);
      setShowTips(false);
      return;
    }

    
    if (!SearchModule) return;

    try {
      const result = await SearchModule.getInputTips({
        keyword: text,
        city,
      });
      
      setTips(result.tips || []);
      setShowTips(result.tips && result.tips.length > 0);
    } catch (error) {
      console.error('[SearchModuleTest] 获取提示出错:', error);
      setTips([]);
      setShowTips(false);
    }
  };

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInputTips(keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, city]);

  const testInputTips = async () => {
    console.log('[SearchModuleTest] testInputTips 被调用');
    addLog('═══ 测试输入提示 ═══');

    
    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      addLog(`🔍 关键词: ${keyword}`);
      addLog(`📍 城市: ${city}`);
      
      const result = await SearchModule.getInputTips({
        keyword,
        city,
      });
      
      addLog(`✅ 获取提示成功!`);
      addLog(`📊 提示数: ${result.tips.length}`);
      
      result.tips.slice(0, 5).forEach((tip: SearchModule.InputTip, index: number) => {
        addLog(`${index + 1}. ${tip.name}`);
        if (tip.address) addLog(`   ${tip.address}`);
      });
      
    } catch (error) {
      console.error('[SearchModuleTest] 获取提示出错:', error);
      addLog(`❌ 获取提示失败: ${error}`);
    }
  };

  const testAlongSearch = async () => {
    console.log('[SearchModuleTest] testAlongSearch 被调用');
    addLog('═══ 测试沿途搜索 ═══');

    
    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      // 模拟一条路线：从天安门到景山公园
      const polyline = [
        { latitude: 39.9042, longitude: 116.4074 }, // 天安门
        { latitude: 39.9100, longitude: 116.4074 }, // 中间点
        { latitude: 39.9250, longitude: 116.4074 }, // 景山公园
      ];
      
      // 沿途搜索只支持：加油站、ATM、汽修、厕所
      const searchKeyword = 'ATM';
      addLog(`🔍 搜索关键词: ${searchKeyword}`);
      addLog(`📍 路线: 天安门 → 景山公园`);
      addLog(`📏 路线点数: ${polyline.length}`);
      addLog(`ℹ️ 支持的类型: 加油站、ATM、汽修、厕所`);
      
      const result = await SearchModule.searchAlong({
        keyword: searchKeyword,
        polyline,
       
      });
      
      addLog(`✅ 搜索成功!`);
      addLog(`📊 总数: ${result.total}`);
      addLog(`📍 结果数: ${result.pois.length}`);
      
      result.pois.slice(0, 3).forEach((poi: SearchModule.POI, index: number) => {
        addLog(`${index + 1}. ${poi.name}`);
        addLog(`   地址: ${poi.address || '无'}`);
        if (poi.distance) {
          addLog(`   距离: ${poi.distance}米`);
        }
      });
      
    } catch (error) {
      console.error('[SearchModuleTest] 沿途搜索出错:', error);
      addLog(`❌ 搜索失败: ${error}`);
    }
  };

  const testPolygonSearch = async () => {
    console.log('[SearchModuleTest] testPolygonSearch 被调用');
    addLog('═══ 测试多边形搜索 ═══');

    
    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      // 定义天安门周边的多边形区域
      const polygon = [
        { latitude: 39.900, longitude: 116.395 }, // 西南角
        { latitude: 39.900, longitude: 116.420 }, // 东南角
        { latitude: 39.915, longitude: 116.420 }, // 东北角
        { latitude: 39.915, longitude: 116.395 }, // 西北角
      ];
      
      addLog(`🔍 搜索关键词: ${keyword}`);
      addLog(`📍 搜索区域: 天安门周边多边形`);
      addLog(`📏 多边形顶点数: ${polygon.length}`);
      
      const result = await SearchModule.searchPolygon({
        keyword,
        polygon,
        pageSize: 10,
        pageNum: 1,
      });
      
      addLog(`✅ 搜索成功!`);
      addLog(`📊 总数: ${result.total}`);
      addLog(`📍 结果数: ${result.pois.length}`);
      
      result.pois.forEach((poi: SearchModule.POI, index: number) => {
        addLog(`${index + 1}. ${poi.name}`);
        addLog(`   地址: ${poi.address || '无'}`);
       
        if (poi.location?.latitude && poi.location?.longitude) {
          addLog(`   坐标: ${poi.location.latitude.toFixed(4)}, ${poi.location.longitude.toFixed(4)}`);
        }
      });
      
    } catch (error) {
      console.error('[SearchModuleTest] 多边形搜索出错:', error);
      addLog(`❌ 搜索失败: ${error}`);
    }
  };

  const testPoiDetail = async () => {
    console.log('[SearchModuleTest] testPoiDetail 被调用');
    addLog('═══ 测试 POI 详情 ═══');

    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      // 为了演示，先搜索“天安门”获取一个真实的 ID
      addLog('1. 预搜索"天安门"以获取有效 ID...');
      const searchResult = await SearchModule.searchPOI({
        keyword: '天安门',
        city: '北京',
        pageSize: 1
      });

      let targetId = 'B000A83M61'; // 默认备用
      if (searchResult.pois.length > 0) {
        targetId = searchResult.pois[0].id;
        addLog(`✅ 获取到 ID: ${targetId} (${searchResult.pois[0].name})`);
      } else {
        addLog(`⚠️ 未搜到结果，使用默认 ID: ${targetId}`);
      }
      
      addLog(`🔍 开始查询 POI 详情...`);
      const result = await SearchModule.getPoiDetail(targetId);
      
      addLog(`✅ 详情查询成功!`);
      addLog(`📌 名称: ${result.name}`);
      addLog(`📍 地址: ${result.address}`);
      addLog(`📞 电话: ${result.tel || '暂无'}`);
      addLog(`🏷️ 类型: ${result.typeDes}`);
      
      if (result.location) {
        addLog(`🌐 坐标: ${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}`);
      }

    } catch (error) {
      console.error('[SearchModuleTest] POI 详情搜索出错:', error);
      addLog(`❌ 详情查询失败: ${error}`);
    }
  };

  const testReGeocode = async () => {
    console.log('[SearchModuleTest] testReGeocode 被调用');
    addLog('═══ 测试逆地理编码 ═══');
 

    if (!SearchModule) {
      addLog('❌ 搜索模块未加载');
      return;
    }

    try {
      // 天安门坐标
      const location = { latitude: 39.908823, longitude: 116.397470 };
      
      addLog(`📍 坐标: ${location.latitude}, ${location.longitude}`);
      addLog(`📏 搜索半径: 1000米`);
      
      const result = await SearchModule.reGeocode({
        location,
        radius: 1000,
        requireExtension: true
      });
      console.log(JSON.stringify(result));
      addLog(`✅ 逆地理编码成功!`);
      addLog(`🏠 格式化地址: ${result.formattedAddress}`);
      addLog(`🏙️ 所在区: ${result.addressComponent?.district || '未知'}`);
      
      if (result.pois && result.pois.length > 0) {
        addLog(`📍 周边POI数量: ${result.pois.length}`);
        result.pois.slice(0, 3).forEach((poi: SearchModule.POI, index: number) => {
          addLog(`   ${index + 1}. ${poi.name} (${poi.typeDes || '未知类型'})`);
        });
      }

      if (result.roads && result.roads.length > 0) {
         addLog(`🛣️ 周边道路: ${result.roads[0].name}`);
      }
      
    } catch (error) {
      console.error('[SearchModuleTest] 逆地理编码出错:', error);
      addLog(`❌ 逆地理编码失败: ${error}`);
    }
  };

  const clearLog = () => {
    console.log('[SearchModuleTest] clearLog 被调用');
    setLog([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 搜索模块测试</Text>
      <Text style={styles.subtitle}>测试 expo-gaode-map 内置搜索</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>搜索关键词:</Text>
        <View>
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={(text) => {
              console.log('[SearchModuleTest] 关键词改变:', text);
              setKeyword(text);
            }}
            onFocus={() => {
              if (tips.length > 0) setShowTips(true);
            }}
            placeholder="输入关键词（如：餐厅、酒店）"
          />
          
          {showTips && tips.length > 0 && (
            <View style={styles.tipsContainer}>
              <FlatList
                data={tips.slice(0, 5)}
                nestedScrollEnabled
                keyExtractor={(item, index) => `${item.id || index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tipItem}
                    onPress={() => {
                      setKeyword(item.name);
                      setShowTips(false);
                      addLog(`✅ 选择提示: ${item.name}`);
                    }}
                  >
                    <Text style={styles.tipName}>{item.name}</Text>
                    {item.address && (
                      <Text style={styles.tipAddress}>{item.address}</Text>
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.tipSeparator} />}
              />
              <TouchableOpacity
                style={styles.closeTips}
                onPress={() => setShowTips(false)}
              >
                <Text style={styles.closeTipsText}>关闭</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text style={styles.inputLabel}>城市:</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={(text) => {
            console.log('[SearchModuleTest] 城市改变:', text);
            setCity(text);
          }}
          placeholder="输入城市"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('[SearchModuleTest] 测试模块加载按钮被点击');
            testModuleLoad();
          }}
        >
          <Text style={styles.buttonText}>🔌 测试模块加载</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('[SearchModuleTest] POI搜索按钮被点击');
            testPOISearch();
          }}
        >
          <Text style={styles.buttonText}>🔍 POI 搜索</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('[SearchModuleTest] 周边搜索按钮被点击');
            testNearbySearch();
          }}
        >
          <Text style={styles.buttonText}>📍 周边搜索</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[SearchModuleTest] 输入提示按钮被点击');
            testInputTips();
          }}
        >
          <Text style={styles.buttonText}>💡 输入提示</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[SearchModuleTest] 沿途搜索按钮被点击');
            testAlongSearch();
          }}
        >
          <Text style={styles.buttonText}>🛣️ 沿途搜索</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[SearchModuleTest] 多边形搜索按钮被点击');
            testPolygonSearch();
          }}
        >
          <Text style={styles.buttonText}>📐 多边形搜索</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[SearchModuleTest] 逆地理编码按钮被点击');
            testReGeocode();
          }}
        >
          <Text style={styles.buttonText}>🗺️ 逆地理编码</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[SearchModuleTest] POI详情查询按钮被点击');
            testPoiDetail();
          }}
        >
          <Text style={styles.buttonText}>📍 POI 详情查询</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={() => {
            console.log('[SearchModuleTest] 清空日志按钮被点击');
            clearLog();
          }}
        >
          <Text style={styles.buttonText}>🗑️ 清空日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>📝 测试日志 (共 {log.length} 条):</Text>
        <ScrollView style={styles.logScroll}>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>点击上方按钮开始测试...</Text>
          ) : (
            log.map((item, index) => (
              <Text key={index} style={styles.logItem}>
                {item}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logEmpty: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#F57C00',
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  tipsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tipItem: {
    padding: 12,
  },
  tipName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  tipAddress: {
    fontSize: 12,
    color: '#666',
    },
  tipSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  closeTips: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  closeTipsText: {
    fontSize: 13,
    color: '#666',
  },
});
