const gui = require('gui')

const darkTheme = {
  channelHeader: {
    height: 45,
    paddingX: 10,
    paddingY: 5,
    nameFont: gui.Font.default().derive(3, 'bold', 'normal'),
    descriptionFont: gui.Font.default().derive(-1, 'normal', 'normal'),
    fontColor: '#2C2D30',
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
  }
}

module.exports = darkTheme
