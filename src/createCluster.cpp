
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

extern void consoleLog(long long n);

int data[1000000][2];
int boundary[2][2]; // 屏幕的左上角和右下角坐标，以此表示屏幕边界
int clusterTag[1000000]; //每项与data一一对应，表示每个点所属哪个聚合点
int gridSize; // 多少范围进行聚合

// 点是否在屏幕内
bool isPointInScreen (int point[2]) {
  return point[0] >= boundary[0][0] - gridSize &&
      point[0] <= boundary[1][0] + gridSize &&
      point[1] <= boundary[0][1] + gridSize &&
      point[1] >= boundary[1][1] - gridSize;
}
// 点是否在聚合点的范围内
bool isPointInCluster (int point[2], int cluster[2]) {
  return point[0] >= cluster[0] - gridSize &&
      point[0] <= cluster[0] + gridSize &&
      point[1] <= cluster[1] + gridSize &&
      point[1] >= cluster[1] - gridSize;
}
extern "C" {
  void setBoundary (int x1,int y1,int x2,int y2) {
    boundary[0][0] = x1;
    boundary[0][1] = y1;
    boundary[1][0] = x2;
    boundary[1][1] = y2;
  }
  // l表示实际数据的长度
  int createCluster(int l, int size) {
    gridSize = size;
    int n = 0; //表示已有聚合点的个数
    int clusterToAddTo=0; // 表示要加入的那个聚合点，最小值为1
    int cluster[200][2]; //表示聚合点集合，上限200个
    for (int i = 0; i<l; i++) {
      // 先判断是否在屏幕内
      if (isPointInScreen(data[i])) {
        long long d = 0; //long 最大型
        for (int j = 0; n>0 && j<n; j++) {
          if (isPointInCluster(data[i], cluster[j])) {
            // long dd = sqrt(pow(cluster[j][0] - data[i][0], 2) + pow(cluster[j][1] - data[i][1], 2));
            long long dd = (cluster[j][0] - data[i][0])*(cluster[j][0] - data[i][0]) + (cluster[j][1] - data[i][1])*(cluster[j][1] - data[i][1]);
            if (d == 0 || dd < d) {
              d = dd;
              clusterToAddTo = j+1;
            }
          }
        };
        if (clusterToAddTo !=0) {
          clusterTag[i] = clusterToAddTo;
          clusterToAddTo = 0;
          d = 0;
        } else {
          n++;
          cluster[n-1][0] = data[i][0];
          cluster[n-1][1] = data[i][1];
          clusterTag[i] = n;
        }
      // 若不在屏幕内，则相应的clusterTag
      } else {
        clusterTag[i] = 0; //0表示没有在屏幕内
      }
    }
    return n;
  }
  int* getData() {
    return &(data[0][0]);
  }
  int* getClusterTag() {
    return &(clusterTag[0]);
  }
}


