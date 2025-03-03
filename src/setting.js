/** last changed: 2022.3.6 */

Shuang.app.setting = {
  config: {},
  reload() {
    /** Reading Storage or Using Default **/
    this.config = {
      scheme: readStorage('scheme') || 'ziranma',
      mode: readStorage('mode') || 'lv4',
      showPic: readStorage('showPic') || 'true',
      darkMode: readStorage('darkMode') || 'true',
      showKeys: readStorage("showKeys") || "true",
      showPressedKey: readStorage("showPressedKey") || "true",
      keyboardLayout: readStorage("keyboardLayout") || 'qwerty',
      batchSize: readStorage('batchSize') || 50,
    }
    /** Applying Settings :: Changing UI **/
    const { scheme, mode, showPic, darkMode, showKeys, showPressedKey, keyboardLayout, batchSize } = this.config
    Array.prototype.find.call($('#scheme-select').children,
      schemeOption => Shuang.resource.schemeList[scheme].startsWith(schemeOption.innerText)
    ).selected = true
    Array.prototype.find.call($('#keyboard-layout-select').children,
      keyboardLayoutOption => Shuang.resource.keyboardLayoutList[keyboardLayout].startsWith(keyboardLayoutOption.innerText)
    ).selected = true
    $('#mode-select')[Object.keys(Shuang.app.modeList).indexOf(mode)].selected = true
    $('#pic-switcher').checked = showPic === 'true'
    $('#dark-mode-switcher').checked = darkMode === 'true'
    $('#show-keys').checked = showKeys === 'true'
    $('#show-pressed-key').checked = showPressedKey === 'true'
    /** Applying Settings :: Invoking Actions  **/
    this.setScheme(Shuang.resource.schemeList[scheme], false)
    this.setKeyboardLayout(Shuang.resource.keyboardLayoutList[keyboardLayout])
    this.setMode(Shuang.app.modeList[mode].name)
    this.setPicVisible(showPic)
    this.setDarkMode(darkMode)
    this.setShowKeys(showKeys)
    this.setShowPressedKey(showPressedKey)
    this.setBatchSize(batchSize)
  },
  setBatchSize(batchSize) {
    $('#batch-size').value = `${batchSize}`
    Shuang.core.statistics.batchSize = batchSize
    writeStorage('batchSize', batchSize)
    this.updateStatistics()
  },
  updateStatistics() {
    if (Shuang.core.statistics.startAt > 0) {
        Shuang.core.statistics.kpm = (Shuang.core.statistics.count * 1000 * 60) / ((new Date()).getTime() - Shuang.core.statistics.startAt)
        Shuang.core.statistics.correctRate = Shuang.core.statistics.count == 0 ? 0 : (Shuang.core.statistics.count * 100 / (Shuang.core.statistics.countWrong + Shuang.core.statistics.count))
    }
    $('#status-line-round').innerText = `${Shuang.core.statistics.count + 1} / ${Shuang.core.statistics.batchSize}`
    $('#status-line-status').innerText = `${Shuang.core.statistics.kpm.toFixed(2)} kpm`
    $('#status-line-rate').innerText = `${Shuang.core.statistics.correctRate.toFixed(2)} %`
  },
  setScheme(schemeName, next = true) {
    this.config.scheme = Object.keys(Shuang.resource.schemeList)[
      Object.values(Shuang.resource.schemeList)
        .findIndex(scheme => scheme.startsWith(schemeName))
    ]
    writeStorage('scheme', this.config.scheme)
    if (next) Shuang.app.action.next()
    this.updateKeysHint()
    this.updateTips()
    this.updateKeyboardLayout()
    $('#status-line-scheme').innerText = schemeName
  },
  setKeyboardLayout(layoutName) {
    this.config.keyboardLayout = Object.keys(Shuang.resource.keyboardLayoutList)[
        Object.values(Shuang.resource.keyboardLayoutList)
            .findIndex(layout => layout.startsWith(layoutName))
    ]
    writeStorage('keyboardLayout', this.config.keyboardLayout)
    this.updateKeysHint()
    this.updateKeyboardLayout()
    $('#status-line-keyboard').innerText = layoutName
  },
  updateKeyboardLayout() {
    const currentKeyboardLayout = Shuang.resource.keyboardLayout[this.config.keyboardLayout]
    const currentScheme = Shuang.resource.scheme[this.config.scheme]
    // check if the keyboard layout and scheme is valid
    if (!currentKeyboardLayout || !currentScheme) {
        return
    }
    // reverse map scheme.detail.sheng key and value
    const key2sheng = invertMap(currentScheme.detail.sheng)
    const key2yun = invertMap(currentScheme.detail.yun)

    // update the keyboard layout
    currentKeyboardLayout.layout.forEach((element, rowIdx) => {
        element.split('').forEach((key, colIdx) => {
            var yunSpanList = ''
            if (Array.isArray(key2yun[key])) {
                key2yun[key].forEach(e => {
                    yunSpanList += `<div><span class="key-character">${e}</span></div>`
                })
            } else if (key2yun[key] != undefined) {
                yunSpanList += `<div><span class="key-character">${key2yun[key]}</span></div>`
            }
            $(`#row-${rowIdx + 1}-col-${colIdx + 1}`).innerHTML = `
            <div class="key-container">
                <div class="top">
                    <div class="left">
                        <span class="key-character">${key.toUpperCase()}</span>
                    </div>
                    <div class="right">
                        <span class="key-character">${key == key2sheng[key] || key2sheng[key] == undefined ? '' : key2sheng[key]}</span>
                    </div>
                </div>
                <div class="bottom">
                    <div class="left"></div>
                    <div class="right">
                        ${yunSpanList}
                    </div>
                </div>
            </div>`
        })
    })
    // update other-container
    $(`#other-container`).innerHTML = ''
    for (let [py, key] of Object.entries(currentScheme.detail.other)) {
        $(`#other-container`).innerHTML += `
        <div class="other-key-container">
            <div>
                <span class="py">${py}</span>
                <span class="other-key">${key}</span>
            </div>
        </div>`
    }
  },
  setMode(modeName) {
    Shuang.core.history = []
    for (const [mode, { name }] of Object.entries(Shuang.app.modeList)) {
      if (name === modeName) {
        this.config.mode = mode
        $('#mode-desc').innerText = Shuang.app.modeList[mode].desc
        break
      }
    }
    writeStorage('mode', this.config.mode)
    $("#status-line-pool").innerText = modeName
  },
  setPicVisible(bool) {
    this.config.showPic = bool.toString()
    if (this.config.showPic === 'false') {
      $('#keyboard').style.display = 'none'
    } else if (this.config.showPic === 'true') {
      $('#keyboard').style.display = 'block'
    }
    writeStorage('showPic', this.config.showPic)
    this.updateKeysHintLayoutRatio()
  },
  setDarkMode(bool) {
    this.config.darkMode = bool.toString()
    if (this.config.darkMode === 'true') {
      $('body').setAttribute('class', 'dark-mode')
    } else if (this.config.darkMode === 'false') {
      $('body').setAttribute('class', '')
    }
    writeStorage('darkMode', this.config.darkMode)
  },
  setShowKeys(bool) {
    this.config.showKeys = bool.toString()
    writeStorage('showKeys', this.config.showKeys)
    this.updateKeysHint()
  },
  setShowPressedKey(bool) {
    this.config.showPressedKey = bool.toString()
    writeStorage('showPressedKey', this.config.showPressedKey)
  },
  updateKeysHint() {
    const keys = $$('.key')
    for (const key of keys) {
      key.classList.remove('answer')
    }
    if (this.config.showKeys === 'false') return
    const currentKeyboardLayout = Shuang.resource.keyboardLayout[this.config.keyboardLayout]
    if (!currentKeyboardLayout) {
        return
    }
    const keyList = currentKeyboardLayout.layout.join('')

    if (!Shuang.core.current) {
        return
    }

    for (const k of Shuang.core.current.getHint()) {
      keys[keyList.indexOf(k)].classList.add('answer')
    }
    this.updateKeysHintLayoutRatio()
  },
  updateKeysHintLayoutRatio() {
    $('#keys').style.marginLeft = 'auto'
    $('#keys').style.zoom = 'unset'
  },
  updatePressedKeyHint(k) {
    if (this.config.showPressedKey === 'false' || !k) return
    const keys = $$('.key')
    for (const key of keys) {
      key.classList.remove('pressed')
    }
    const currentKeyboardLayout = Shuang.resource.keyboardLayout[this.config.keyboardLayout]
    const keyList = currentKeyboardLayout.layout.join('')
    const index = keyList.indexOf(k.toLowerCase())
    if (index === -1) return
    keys[index].classList.add('pressed')
    setTimeout(() => {
      keys[index].classList.remove('pressed')
    }, 250)
  },
  updateTips() {
    const tips = $('#tips')
    tips.innerHTML = ''
    const currentScheme = Shuang.resource.scheme[this.config.scheme]
    if (currentScheme.tips) {
      const tipsToView = Array.isArray(currentScheme.tips) ? currentScheme.tips : [currentScheme.tips]
      for (const tip of tipsToView) {
        const newLine = document.createElement('div')
        newLine.classList.add('line')
        newLine.innerHTML = tip
        tips.appendChild(newLine)
      }
    }
  }
}

function detectDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true
  }
  if (new Date().getHours() < 6 || new Date().getHours() > 22) {
    return true
  }
  return false
}

function readStorage(key = '') { return localStorage.getItem(key) }
function writeStorage(key = '', value = '') { localStorage.setItem(key, value) }

function invertMap(src) {
    var dest = {}
    // travel src fields
    for (let [sheng, key] of Object.entries(src)) {
        if (!dest[key]) {
            dest[key] = sheng
        } else if (Array.isArray(dest[key])) {
            dest[key].push(sheng)
        } else { 
            dest[key] = [dest[key], sheng]
        }
    }    
    return dest
}
