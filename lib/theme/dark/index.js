const gui = require('gui')

const darkTheme = {
  channelHeader: {
    height: 45,
    padding: 10,
    font: gui.Font.default().derive(4, 'bold', 'normal'),
    fontColor: '#2C2D30',
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  channelItem: {
    height: gui.Font.default().getSize() + 12,
    padding: 10,
    unreadFont: gui.Font.default().derive(0, 'bold', 'normal'),
    normalColor: '#C1C2C6',
    selectedColor: '#FFF',
    disabledColor: '#8B8D94',
    hoverBackground: '#2B2E3B',
    selectedBackground: '#6798A2',
    mentionsWidth: 8,
    mentionsColor: '#FFF',
    mentionsBackground: '#DC5960',
    presenceColor: '#9FEAF9',
    presencePadding: 3,
    presenceRadius: 4,
    exitButtonRadius: 7,
    exitButtonXHeight: 5,
  },
  chatBox: {
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
}

module.exports = darkTheme
