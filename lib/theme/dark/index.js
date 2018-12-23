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
  chatBox: {
    borderColor: '#E5E5E5',
  },
}

module.exports = darkTheme
