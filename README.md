# WebGPU 3D Gaussian Demo

该示例提供一个基于 WebGPU 的简单三维框架：

- 渲染多个 3D 高斯点，并带有深度缓冲。
- 点击画布可读取深度值并反算出世界坐标，实现坐标拾取。
- 所有逻辑均在 `src/main.js` 中实现。

在支持 WebGPU 的浏览器中，直接打开 `index.html` 即可运行。

## 运行测试

```bash
npm test
```

该命令仅进行语法检查。
