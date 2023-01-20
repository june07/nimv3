<template>
    <svg xmlns="http://www.w3.org/2000/svg"
         :width="width"
         :height="height"
         :viewBox="viewBox"
         :aria-labelledby="iconName"
         :preserveAspectRatio="preserveAspectRatio">
        <title :id="iconName" lang="en">{{iconName}}</title>
        <slot />
    </svg>
</template>
<script>
export default {
    props: {
        viewBox: { type: String, default: "0 0 24 24" },
        iconName: { type: String, default: "" },
        width: { type: [Number, String], default: 24 },
        height: { type: [Number, String], default: 24 },
        preserveAspectRatio: { type: String, default: "xMidYMid meet" },
    },
};
</script>
