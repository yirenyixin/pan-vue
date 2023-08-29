<template>
  <div class="home">
    <div class="top-bar">
      <!-- 用户信息和退出按钮 -->
      <img src="@/assets/tx.png" alt="User Avatar" class="avatar" />
      <span class="username">{{ user.uname }}</span>
      <button @click="logout" class="logout-button">退出登录</button>
    </div>
    <div class="a">
      <div class="sidebar">
        <!-- 菜单栏组件 -->
        <router-link to="/home/myResources" class="menu-link">我的资源</router-link>
        <div class="menu-divider"></div>
        <router-link to="/home/downloads" class="menu-link">下载</router-link>
        <div class="menu-divider"></div>
        <router-link to="/home/recycleBin" class="menu-link">回收站</router-link>
      </div>
      <div class="content">
        <!-- 内容区域 -->
        <router-view>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        uname: "",
        uid: null,
      },
    };
  },
  methods: {
    logout() {
      // 移除本地用户登录信息
      sessionStorage.removeItem('userInfo');
      // 跳转页面到登录页
      this.$router.push('/login');
    },
  },
  mounted() {
    if (sessionStorage.getItem('userInfo')) {
      // 将用户信息存储到sessionStorage中
      this.user = JSON.parse(sessionStorage.getItem('userInfo'));
    }
  },
};
</script>

<style>
/* 样式设置 */
html, body {
  height: 845px;
  margin: 0;
  padding: 0;
}

.home {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
}
.a{
  display: flex;
}
.sidebar {
  width: 100px;
  height: 845px;
  background-color: #007bff;
  padding-right: 10px;
}

.menu-link {
  display: block;
  padding: 10px;
  color: #fff;
  text-decoration: none;
  transition: background-color 0.3s, color 0.3s; /* 添加过渡效果 */
}

.menu-link:hover,
.menu-link.router-link-exact-active {
  background-color: #0056b3; /* 鼠标指到和点击时的背景颜色 */
  color: #ff0000; /* 鼠标指到和点击时的字体颜色 */
}

.menu-divider {
  height: 1px;
  background-color: #fff;
  margin: 10px 0;
}

.content {
  /* 右侧内容区域样式 */
  flex: 1;
  padding: 2px;
  margin: 2px;
  border: 1px solid #ccc;
  overflow: auto;
  background-color: #f0f0f0;
  width: 500px;
  height: 845px;
}

.top-bar {
  height: 60px;
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #f0f0f0;
  padding: 0 0px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.username {
  font-size: 16px;
  margin-right: 10px;
}

.logout-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
