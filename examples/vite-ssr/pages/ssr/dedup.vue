<script setup>
import { useHead } from "../../../src"

useHead({
  style: [
    {
      type: "text/css",
      id: "darkStyle",
      children: `
        body {
          background-color: #000;
          color: green;
        }
        html {
          color-scheme: dark;
        }
      `,
    },
  ],
  script: [
    {
      children: `
          function showLog(type, el){
            if(el.id !== 'darkStyle') return;
            var tr = document.createElement('tr');
            tr.innerHTML = "<td>" + type + "</td><td><pre>" + new Option(el.outerHTML).innerHTML +"</pre></td>"
            document.getElementById('logs').appendChild(tr);
          }
          var observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
              mutation.removedNodes.forEach((el) => {
                showLog("Removed", el);
                console.log(el.outerHTML);
              });
              mutation.addedNodes.forEach((el) => {
                showLog("Added", el);
                console.log(el.outerHTML);
              });
            }
          });
          observer.observe(document.querySelector('head'), {
            subtree: false,
            childList: true,
          });
      `,
    },
  ],
})
</script>

<template>
  <table id="logs"></table>
</template>
