//for mac menu issue
const menuShift = menuTemplate => {
    if(process.platform == 'darwin') {
        menuTemplate.unshift({})
    }
}

const devTools = menuTemplate => {

    if(process.env.NODE_ENV !== 'production') {
        menuTemplate.push({
            label: 'Dev Tools',
            accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
            click(item, focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        },
        {
            role: 'reload'
        })
    }
}

module.exports = {
    menuShift,
    devTools
}