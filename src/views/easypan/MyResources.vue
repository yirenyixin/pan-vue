<template>
  <div>
    <div class="button-group">
      <el-button @click="goBack" :disabled="isTopLevel">返回</el-button>
      <span class="current-path">{{ getCurrentPath }}</span>
      <el-button class="action-button" @click="showAddFolderDialog">新增文件夹</el-button>
      <el-button class="action-button" @click="showDeleteDialog">删除</el-button>
      <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
      <el-button class="action-button" @click="showUploadDialog">上传</el-button>
      <el-button class="action-button" @click="startDownload">下载</el-button>
      <el-button class="action-button" @click="shareFiles">分享</el-button>
    </div>
    <ul>
      <li v-for="item in currentFolder.children" :key="item.save_path">
        <input type="checkbox" @change="handleCheckboxChange(item)">
        <label v-if="!item.save_path.includes('/')">
          {{ item.save_path }}
        </label>
        <span v-if="item.children" @click="handleItemClick(item)">{{ item.save_path }}</span>
      </li>
    </ul>
    <el-dialog title="新增文件夹" :visible.sync="dialogVisible">
      <el-input v-model="newFolderName" placeholder="请输入文件夹名称"></el-input>
      <el-button slot="footer" @click="saveNewFolder">保存</el-button>
    </el-dialog>
    <el-dialog title="上传文件" :visible.sync="uploadDialogVisible">
      <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <el-button @click="chooseFile">选择文件</el-button>
        <span v-if="selectedFileName" style="margin-left: 10px;">{{ selectedFileName }}</span>
      </div>
      <el-button @click="startUpload">开始上传</el-button>
    </el-dialog>
<!--    <el-dialog title="下载文件" :visible.sync="downloadDialogVisible">-->
<!--      <el-input v-model="downloadPath" placeholder="输入下载路径"></el-input>-->
<!--      <el-button @click="startDownload">开始下载</el-button>-->
<!--    </el-dialog>-->


  </div>
</template>


<script>
export default {
  data() {
    return {
      directoryTree: {},//目录树
      currentFolder: {},//当前文件目录
      selectedItems: [],//复选框选择的文件目录
      dialogVisible: false,
      newFolderName: '',
      uploadFile: null,
      uploadDialogVisible: false,
      selectedFileName: "",//选择的文件名
      uploading: false, // 是否正在上传handleFileChange
      downloadDialogVisible: false,
      downloadPath: "", // 用户输入的下载路径
      downloadUrl: "", // 下载链接
      downloading: false // 是否正在下载
    };
  },
  computed: {
    isTopLevel() {
      return this.currentFolder === this.directoryTree;
    },
    getCurrentPath() {
      const pathSegments = [];
      let folder = this.currentFolder;
      while (folder) {
        if (folder.save_path) {
          pathSegments.unshift(folder.save_path);
        }
        folder = folder.parent;
      }
      return pathSegments.join('/');
    }
  },
  methods: {
    initializeExpandState(folder) {
      this.directoryTree = folder;
      this.currentFolder = folder;
      this.addParentReference(this.directoryTree, null);
    },
    addParentReference(folder, parent) {
      folder.parent = parent;
      if (folder.children) {
        folder.children.forEach(child => {
          this.addParentReference(child, folder);
        });
      }
    },
    handleItemClick(item) {
      if (item.children) {
        this.currentFolder = item;
        this.selectedItems = [];
      }
    },
    goBack() {
      if (this.currentFolder.parent) {
        this.currentFolder = this.currentFolder.parent;
        this.selectedItems = [];
      }
    },
    handleCheckboxChange(item) {
      if (this.isSelected(item)) {
        this.selectedItems = this.selectedItems.filter(selectedItem => selectedItem !== item);
      } else {
        this.selectedItems.push(item);
      }
      this.printSelectedPaths();
    },
    isSelected(item) {
      return this.selectedItems.includes(item);
    },
    printSelectedPaths() {
      const selectedPaths = this.selectedItems.map(item => {
        const pathSegments = [];
        let folder = item;
        while (folder) {
          if (folder.save_path) {
            pathSegments.unshift(folder.save_path);
          }
          folder = folder.parent;
        }
        return pathSegments.join('/');
      });
      console.log('Selected Paths:', selectedPaths);
    },


    showDeleteDialog() {
      if (this.selectedItems.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要删除的文件或文件夹'
        });
        return;
      }

      this.$confirm('确认删除已选择的文件或文件夹吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const pathsToDelete = this.selectedItems.map(item => {
          const pathSegments = [];
          let folder = item;
          while (folder) {
            if (folder.save_path) {
              pathSegments.unshift(folder.save_path);
            }
            folder = folder.parent;
          }
          return pathSegments.join('/');
        });

        this.axios
            .post('/api/path/delete', pathsToDelete)
            .then(response => {
              // 处理删除成功后的逻辑，例如重新加载数据或更新视图
              this.fetchData();
              this.selectedItems = [];
            })
            .catch(error => {
              console.error('删除文件或文件夹失败', error);
            });
      }).catch(() => {
        // 用户取消删除操作
      });
    },
    fetchData() {
      // 从sessionStorage获取用户信息
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      const uname = userInfo.uname; // 假设用户信息中有username字段

      console.log(uname);
      this.axios
          .post('/api/path/get', { uname: uname }, {
            headers: {
              'Content-Type': 'application/json' // 设置请求头
            }
          })
          .then(response => {
            this.initializeExpandState(response.data);
            console.log(response.data)
          })
          .catch(error => {
            console.error('获取目录树数据失败', error);
          });
    },
    showAddFolderDialog() {
      this.dialogVisible = true;
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
    },

    //上传文件
    handleFileChange(event) {
      this.uploadFile = event.target.files[0];
      this.selectedFileName = this.uploadFile ? this.uploadFile.name : "";
    },

    chooseFile() {
      this.$refs.fileInput.click(); // 触发文件选择
    },
    async startUpload() {
      if (!this.uploadFile) {
        this.$message({
          type: 'warning',
          message: '请选择一个文件上传',
        });
        return;
      }

      this.uploading = true;

      const chunkSize = 10 * 1024 * 1024; // 10MB
      const totalChunks = Math.ceil(this.uploadFile.size / chunkSize);

      let chunkIndex = 0;
      let startByte = 0;

      while (chunkIndex < totalChunks) {
        const endByte = Math.min(startByte + chunkSize, this.uploadFile.size);
        const chunk = this.uploadFile.slice(startByte, endByte);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('savePath', this.getCurrentPath);
        formData.append('chunkIndex', chunkIndex);
        formData.append('totalChunks', totalChunks);
        // 添加文件名到 formData
        formData.append('fileName', this.uploadFile.name);

        await this.axios
            .post('/api/path/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then(response => {
              console.log(response.data);
              chunkIndex++;
              startByte = endByte;
            })
            .catch(error => {
              console.error('文件切片上传失败', error);
              this.uploading = false;
              return;
            });
      }

      this.uploading = false;
      this.uploadFile = null;
      this.uploadDialogVisible = false;
      this.fetchData();
    },
// 文件下载
//     async startDownload() {
//       if (this.selectedItems.length === 0) {
//         this.$message({
//           type: 'warning',
//           message: '请先选择要下载的文件',
//         });
//         return;
//       }
//
//       const pathsToDownload = this.selectedItems
//           .filter(item => !item.save_path.endsWith('/'))
//           .map(item => {
//             const pathSegments = [];
//             let folder = item;
//             while (folder) {
//               if (folder.save_path) {
//                 pathSegments.unshift(folder.save_path);
//               }
//               folder = folder.parent;
//             }
//             return pathSegments.join('/');
//           });
//
//       for (const path of pathsToDownload) {
//         await this.downloadFileWithResume(path);
//       }
//     },
//
//     async downloadFileWithResume(path) {
//       try {
//         const downloadedBytes = await this.getDownloadedBytes(path);
//         // const response = await this.axios.get(`/api/path/download/${encodeURIComponent(path.replace(/\/\//g, '/'))}`, {
//         const response = await this.axios.get(`/api/path/download/${path}`, {
//           responseType: 'blob',
//           headers: {
//             Range: `bytes=${downloadedBytes}-`,
//           },
//         });
//
//         if (response.status === 206) { // Partial Content
//           const blob = response.data;
//           const downloadUrl = URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = downloadUrl;
//           link.download = path.split('/').pop();
//           link.click();
//           URL.revokeObjectURL(downloadUrl);
//         }
//       } catch (error) {
//         console.error('下载文件失败', error);
//       }
//     },
//
//     async getDownloadedBytes(path) {
//       try {
//         // const response = await this.axios.head(`/api/path/download/${encodeURIComponent(path.replace(/\/\//g, '/'))}`);
//         const response = await this.axios.head(`/api/path/download/${path}`);
//         const contentRange = response.headers['content-range'];
//         if (contentRange) {
//           const [, end] = contentRange.match(/\/(\d+)$/);
//           return parseInt(end, 10) + 1;
//         }
//       } catch (error) {
//         console.error('获取已下载字节数失败', error);
//       }
//       return 0;
//     },


// // 文件下载
    async startDownload() {
      if (this.selectedItems.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要下载的文件'
        });
        return;
      }else if (this.selectedItems.length > 1) {
        this.$message({
          type: 'warning',
          message: '一次只能选择一个文件下载'
        });
        return;
      }
      const pathsToDownload = this.selectedItems
          .filter(item => !item.save_path.endsWith('/'))
          .map(item => {
            const pathSegments = [];
            let folder = item;
            while (folder) {
              if (folder.save_path) {
                pathSegments.unshift(folder.save_path);
              }
              folder = folder.parent;
            }
            return pathSegments.join('/');
          });

      // 向服务器发送下载请求，将选择的文件路径发送给服务器
      await this.axios
          .post('/api/path/download', pathsToDownload)
          .then(response => {
            const downloadUrls = response.data.downloadUrls; // 获取服务器返回的下载链接列表
            console.log(downloadUrls);
            downloadUrls.forEach(downloadUrl => {
              window.open(downloadUrl, '_blank'); // 在新窗口中打开下载链接
            });
          })
          .catch(error => {
            console.error('下载文件失败', error);
          });
    },
    //文件分享
    async shareFiles() {
      if (this.selectedItems.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要分享的文件或文件夹'
        });
        return;
      }else if (this.selectedItems.length > 1) {
        this.$message({
          type: 'warning',
          message: '一次只能选择一个文件或一个文件夹分享'
        });
        return;
      }

      const pathsToShare = this.selectedItems
          .map(item => {
            const pathSegments = [];
            let folder = item;
            while (folder) {
              if (folder.save_path) {
                pathSegments.unshift(folder.save_path);
              }
              folder = folder.parent;
            }
            return pathSegments.join('/');
          });

      // 向服务器发送分享请求，将选择的文件路径发送给服务器
      try {
        console.log(pathsToShare);
        const response = await this.axios.post('/api/share/shareUrl', pathsToShare);
        const { shareLink, sharePassword } = response.data; // 从服务器响应中获取分享链接和密码

        // 将分享链接和密码呈现给用户，可以使用弹窗、通知等方式
        this.$message({
          type: 'success',
          message: `分享链接：${shareLink}\n分享密码：${sharePassword}`
        });

        // 清空选中的项目
        this.selectedItems = [];
      } catch (error) {
        console.error('分享文件失败', error);
      }
    },
    //新增文件夹
    saveNewFolder() {
      if (this.newFolderName.trim() !== '') {
        this.dialogVisible = false;

        const newFolderPath = this.getCurrentPath ;
        const fileName=this.newFolderName;

        this.axios
            .post('/api/path/save', { newPath: newFolderPath, name: fileName }) // 传递新文件夹路径给服务器
            .then(response => {
              // 处理保存成功后的逻辑，例如重新加载数据或更新视图
              this.fetchData();
              this.selectedItems = [];
            })
            .catch(error => {
              console.error('保存文件夹失败', error);
            });
      } else {
        // 提示用户输入有效的文件夹名称
        this.$message({
          type: 'warning',
          message: '请输入有效的文件夹名称'
        });
      }
    }
  },
  mounted() {
    this.fetchData();
    this.uploadDialogVisible = false; // 初始时隐藏上传对话框
  }
};
</script>


<style>
.button-group {
  display: flex;
  align-items: center;
}

.current-path {
  flex: 1;
  text-align: center;
  margin: 0 20px;
}

.action-button {
  margin-right: 10px;
}
</style>
