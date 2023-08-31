<template>
  <div>
    <input v-model="pwd" placeholder="请输入密码" />
    <button @click="confirmPassword">确定</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentRoute: "",
      pwd: "",
      directoryTree: {},
      currentFolder: {},
      selectedItems: [],
    };
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
    confirmPassword() {
      const password = this.pwd.trim(); // 去除首尾空格

      if (password) {
        // 执行密码相关的操作，例如请求服务器等
        // 在这里你可以使用 password 变量来进行相应的处理
        console.log("输入的密码是：" + password);
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
      } else {
        // 提示用户输入密码
        console.log("请输入密码");
      }
    },
  },
  mounted() {
    // 使用Vue Router获取当前页面的URL
    this.currentRoute = decodeURIComponent(this.$router.currentRoute.path).replace("/share/", "").split(" ");

    // 如果数组中有两个元素，即包含密码信息
    if (this.currentRoute.length === 2) {
      this.pwd = this.currentRoute[1].replace("分享密码：","");
      this.currentRoute=this.currentRoute[0];
    }
  },
};
</script>
