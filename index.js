async function loadBlob(fileName) {
  const fetched = await fetch(fileName);
  return await fetched.blob();
}

/** Write the Chrome logo to the clipboard when clicking "Copy" */
copy.onclick = async () => {
  try {
    const url =
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Chrome_Material_Icon-450x450.png";
    const blobInput = await loadBlob(url);
    const clipboardItemInput = new ClipboardItem({ "image/png": blobInput });
    await navigator.clipboard.write([clipboardItemInput]);

    log("Image copied.");
  } catch (e) {
    log(e);
  }
};

/** Read from clipboard when clicking the Paste button */
paste.onclick = async () => {
  try {
    const clipboardItems = await navigator.clipboard.read();

    const clipboardTypes = clipboardItems.map((e) => e.types).join('<br>');
    document.getElementById("clipboard-info").innerHTML = clipboardTypes;

    for(let i=0; i<clipboardItems.length; i++){
      let type = clipboardItems[i].types[i];
      console.log(type);
      let blob = await clipboardItems[i].getType(type);
      
      let blobOutput;
      switch(type) {
        case "text/html":
          blobOutput = await blob.text();
          document.getElementById("html-field").value = blobOutput;
          break;
        case "text/plain":
          blobOutput = await blob.text();
          document.getElementById("text-field").value = blobOutput;
          break;
        case "image/png":
          document.getElementById("image-field").src = window.URL.createObjectURL(blobOutput);
          break;
        default:
          break;
      }
    }
    log("Clipboard pasted.");
  } catch (e) {
    console.log(e);
    log("Failed to read clipboard");
  }
};

/** Watch for pastes */
navigator.clipboard.addEventListener("clipboardchange", async (e) => {
  const text = await navigator.clipboard.getText();
  log("Updated clipboard contents: " + text);
});

/** The 4 available permissions for Async Clipboard API: */
const PERMISSIONS = [
  { name: "clipboard-read" },
  { name: "clipboard-write" },
  //{ name: "clipboard-read",  allowWithoutGesture: false },
  //{ name: "clipboard-read",  allowWithoutGesture: true  },
  //{ name: "clipboard-write", allowWithoutGesture: false },
  //{ name: "clipboard-write", allowWithoutGesture: true  }
];

/** Query for each permission's state, then watch for changes and update buttons accordingly: */
Promise.all(
  PERMISSIONS.map((descriptor) => navigator.permissions.query(descriptor))
).then((permissions) => {
  permissions.forEach((status, index) => {
    let descriptor = PERMISSIONS[index],
      name = permissionName(descriptor),
      btn = document.createElement("button");
    btn.title = "Click to request permission";
    btn.textContent = name;
    // Clicking a button (re-)requests that permission:
    btn.onclick = () => {
      navigator.permissions
        .request(descriptor)
        .then((status) => {
          log(`Permission ${status.state}.`);
        })
        .catch((err) => {
          log(`Permission denied: ${err}`);
        });
    };
    // If the permission status changes, update the button to show it
    status.onchange = () => {
      btn.setAttribute("data-state", status.state);
    };
    status.onchange();
    permbuttons.appendChild(btn);
  });
});

function permissionName(permission) {
  let name = permission.name.split("-").pop();
  if ("allowWithoutGesture" in permission) {
    name +=
      " " +
      (permission.allowWithoutGesture ? "(without gesture)" : "(with gesture)");
  }
  return name;
}

function log(value) {
  clearTimeout(log.timer);
  if (toast.hidden) toast.textContent = value;
  else toast.textContent += "\n" + value;
  toast.className = String(value).match(/error/i) ? "error" : "";
  toast.hidden = false;
  log.timer = setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}
