/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2024-12-17 21:28:15
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-03-25 09:25:54
 * @FilePath     : /jintan-app/lib/amap3d/lib/src/cluster/cluster-view.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import * as React from "react";
import { StyleSheet, Text,  ViewStyle } from "react-native";
import { ClusterParams } from ".";
import Marker from "../marker";
import { View } from "@/components/Themed";

interface Props {
  cluster: ClusterParams;
  style?: ViewStyle;
  textStyle?: ViewStyle;
  onPress?: (params: ClusterParams) => void;
}

export default class ClusterView extends React.PureComponent<Props> {
  onPress = () => {
    this.props.onPress?.call(this, this.props.cluster);
  };

  renderClusterView = () => {
    const { count } = this.props.cluster;
    const size = 36 + Math.log2(count);
    const clusterStyle = { width: size, height: size, borderRadius: size / 2 };
    return (
      <View style={[style.cluster, clusterStyle, this.props.style]}>
        <Text style={[style.text, this.props.textStyle]}>{count}</Text>
      </View>
    );
  };

  render() {
    return (
      <Marker onPress={this.onPress} position={this.props.cluster.position}>
        {this.renderClusterView()}
      </Marker>
    );
  }
}

const style = StyleSheet.create({
  cluster: {
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "rgba(245,83,61,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontWeight: "600" },
});
