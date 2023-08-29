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
    <el-dialog title="下载文件" :visible.sync="downloadDialogVisible">
      <el-input v-model="downloadPath" placeholder="输入下载路径"></el-input>
      <el-button @click="startDownload">开始下载</el-button>
    </el-dialog>


  </div>
</template>


<script>
export default {
  data() {
    return {
      directoryTree: {},
      currentFolder: {},
      selectedItems: [],
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
      this.axios
          .post('/api/path/get')
          .then(response => {
            this.initializeExpandState(response.data[0]);
          })
          .catch(error => {
            console.error('获取目录树数据失败', error);
          });
    },
    showAddFolderDialog() {
      this.dialogVisible = true;
    },
    download() {
      if (this.selectedItems.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要下载的文件或文件夹'
        });
        return;
      }

      this.$confirm('确认下载已选择的文件或文件夹吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const pathsToDownload = this.selectedItems.map(item => {
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
            .post('/api/path/download', pathsToDownload)
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
    async startDownload() {
      if (this.selectedItems.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要下载的文件'
        });
        return;
      }

      const pathsToDownload = this.selectedItems
          .filter(item => !item.save_path.endsWith('/')) // 过滤掉最后一个字符为"/"的路径
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
      console.log(pathsToDownload);
      // 向服务器发送下载请求，将选择的文件路径发送给服务器
      await this.axios
          .post('/api/path/download', {
            paths: pathsToDownload
          })
          .then(response => {
            // 处理下载请求返回的数据，例如获取下载链接等
            // 在浏览器中打开下载链接，浏览器会自动进行下载
            window.open(response.data.downloadUrl, '_blank');
          })
          .catch(error => {
            console.error('下载文件失败', error);
          });
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
