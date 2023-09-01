<template>
  <div class="share">
    <el-input v-model="pwd" class="share-input" placeholder="请输入密码" />
    <el-button @click="confirmPassword">确定</el-button>

    <el-dialog
        title="目录树"
        :visible.sync="dialogVisible"
        width="50%"
        :before-close="handleDialogClose"
    >
      <div>
        <span class="current-path">{{ getCurrentPath }}</span>
        <el-button @click="goBack" :disabled="isTopLevel">返回</el-button>
        <ul>
          <li v-for="item in currentFolder.children" :key="item.save_path">
            <span v-if="item.children" @click="handleItemClick(item)">{{ item.save_path }}</span>
          </li>
        </ul>
        <el-button @click="saveToPath" :loading="isLoading">保存到此路径</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>

export default {
  data() {
    return {
      currentRoute: "",//分享唯一id
      pwd: "",//分享密码
      directoryTree: {},//文件树
      currentFolder: {},//当前选择路径
      dialogVisible: false,
      isLoading: false,
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
    goBack() {
      if (this.currentFolder.parent) {
        this.currentFolder = this.currentFolder.parent;
      }
    },
    handleItemClick(item) {
      if (item.children) {
        this.currentFolder = item;
      }
    },
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
    async  confirmPassword() {
      const password = this.pwd.trim(); // 去除首尾空格

      if (password) {
        // 执行密码相关的操作，例如请求服务器等
        // 在这里你可以使用 password 变量来进行相应的处理
        console.log("输入的密码是：" + password);
        // 从sessionStorage获取用户信息
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        const uname = userInfo.uname; // 假设用户信息中有username字段

        console.log(uname);
        const response = await this.axios.post('/api/share/check', { id: this.currentRoute ,pwd:this.pwd,uname:uname});
        const { path } = response.data; // 从服务器响应中获取分享链接和密码
        if(path!=null){
          this.$message({
            type: 'success',
            message: `密码正确${path}`
          });
            // 从sessionStorage获取用户信息
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            const uname = userInfo.uname; // 假设用户信息中有username字段

            console.log(uname);
            this.axios
                .post('/api/path/getfile', { uname: uname }, {
                  headers: {
                    'Content-Type': 'application/json' // 设置请求头
                  }
                })
                .then(response => {
                  this.initializeExpandState(response.data);
                  this.$message({
                    type: 'success',
                    message: `获取目录树数据成功`
                  });
                  console.log(response.data);
                  this.dialogVisible = true;
                })
                .catch(error => {
                  console.error('获取目录树数据失败', error);
                });
        }else{
          this.$message({
            type: 'error',
            message: `密码错误或已过期`
          });
        }
}
    },
    handleDialogClose(done) {
      // 关闭对话框时重置相关数据
      this.dialogVisible = false;
      // 可以根据需要重置其他数据或执行其他操作
      done();
    },
    //保存文件
    async saveToPath() {
      // 开始加载动画
      this.isLoading = true;

      // 构造要发送给后端的数据
      const dataToSend = {
        currentPath: this.getCurrentPath,
        currentRoute: this.currentRoute
      };

      try {
        const response = await this.axios.post('/api/share/savePath', dataToSend);  // 将接口路径和数据替换为实际情况
        if (response.data.success) {
          this.$message({
            type: 'success',
            message: '已成功保存到此路径'
          });
        } else {
          this.$message({
            type: 'error',
            message: '保存失败，请重试'
          });
        }
      } catch (error) {
        console.error('保存失败', error);
        this.$message({
          type: 'error',
          message: '保存失败，请重试'
        });
      } finally {
        // 结束加载动画
        this.isLoading = false;
      }
    }
  },
  mounted() {
    // 使用Vue Router获取当前页面的URL
    this.currentRoute = decodeURIComponent(this.$router.currentRoute.path).replace("/share/", "").split(" ");

    // 如果数组中有两个元素，即包含密码信息
    if (this.currentRoute.length === 2) {
      this.pwd = this.currentRoute[1].replace("分享密码：","");
      this.currentRoute=this.currentRoute[0];
      console.log(this.currentRoute);
      console.log(this.pwd);
    }else{
      this.currentRoute=this.currentRoute[0];
      console.log(this.currentRoute);
    }
  },
};
</script>
<style scoped>
.share{
  display: flex;
  margin: auto auto;
  margin-top: 20%;
  width: 400px;
}
</style>