<template>
  <div>
    <div class="button-group">
      <!-- 添加下载按钮 -->
      <el-button class="action-button" @click="startDownload">下载所选文件</el-button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    async startDownload() {
      const pathsToDownload = ['easypan//admin//1.txt'];

      // 发送下载请求到服务器
      try {
        const response = await this.axios.post('/api/path/download', pathsToDownload);
        const responseData = response.data; // 获取完整的响应数据对象
        console.log("responseData:", responseData); // 检查完整的响应数据

        const downloadUrls = responseData.downloadUrls; // 获取 downloadUrls 数组
        if (downloadUrls && downloadUrls.length > 0) {
          const downloadUrl = downloadUrls[0]; // 获取第一个下载链接
          console.log("url:", downloadUrl);

          // 根据服务器返回的下载链接，在浏览器中打开下载链接
          window.open(downloadUrl, '_blank');
        } else {
          console.error("下载链接为空。");
        }
      } catch (error) {
        console.error('下载文件失败', error);
      }
    }

  }
}
</script>

<style>
.button-group {
  display: flex;
  align-items: center;
}

.action-button {
  margin-right: 10px;
}
</style>
