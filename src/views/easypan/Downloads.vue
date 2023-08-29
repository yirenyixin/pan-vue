<template>
  <div>
    <el-button @click="goBack" :disabled="isTopLevel">返回</el-button>
    <ul>
      <li v-for="item in currentFolder.children" :key="item.save_path">
        <label>
          <input type="checkbox" @change="handleCheckboxChange(item.save_path)">
          {{ item.save_path }}
        </label>
        <span v-if="item.children" @click="handleItemClick(item)">{{ item.save_path }}</span>
      </li>
    </ul>
    <p v-if="isTopLevel">已经是最上层了</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      directoryTree: {},
      currentFolder: {},
      selectedPaths: []
    };
  },
  computed: {
    isTopLevel() {
      return this.currentFolder === this.directoryTree;
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
      this.currentFolder = item;
    },
    goBack() {
      if (this.currentFolder.parent) {
        this.currentFolder = this.currentFolder.parent;
      }
    },
    handleCheckboxChange(path) {
      if (this.selectedPaths.includes(path)) {
        this.selectedPaths = this.selectedPaths.filter(p => p !== path);
      } else {
        this.selectedPaths.push(path);
      }
      console.log('Selected Paths:', this.selectedPaths);
    },
    fetchData() {
      this.axios
          .post('/api/path/get')
          .then((response) => {
            console.log(response.data[0]);
            this.initializeExpandState(response.data[0]);
          })
          .catch((error) => {
            console.error('获取目录树数据失败', error);
          });
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>
