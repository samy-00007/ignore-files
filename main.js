/* eslint-env es6, browser, node, jquery */
/* global define, brackets */
define(function (require, exports, module) {
    "use strict";

    var CommandManager     = brackets.getModule("command/CommandManager")
    var Menus              = brackets.getModule("command/Menus");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager")
    var FileSystem         = brackets.getModule("filesystem/FileSystem");
    var ExtensionUtils     = brackets.getModule('utils/ExtensionUtils');
    var Dialogs            = brackets.getModule('widgets/Dialogs')
    let prefs                = PreferencesManager.getExtensionPrefs("ignore");
    let html                 = require('text!assets/modal.html')
    
    prefs.definePreference('ignored', 'array', []);
    if(!prefs.get('ignored')) prefs.set('ignored', [])
    
    
    function refreshFileTree() {
        CommandManager.get('file.refresh').execute()
    }
    
    function updateIgnored() {
        let _oldFilter = FileSystem._FileSystem.prototype._indexFilter;
      
        FileSystem._FileSystem.prototype._indexFilter = function (path, name) {
            // Call old filter
            let result = _oldFilter.apply(this, arguments);
        
            if (!result) {
                return false;
            }
            let regexes = prefs.get('ignored') ? prefs.get('ignored').map(x => new RegExp(`^${x}$`)) : [/./]
            return !regexes.some(x => x.test(name))
        };
    }
    
    function addIgnored(x) {
        let json = prefs.get('ignored')
        json.push(x)
        prefs.set('ignored', json)
    }    
    
    function removeIgnored(x) {
        let json = prefs.get('ignored')
        json = json.filter(value => value !== x)
        prefs.set('ignored', json)
    }
    
    function showModal() {
        Dialogs.showModalDialog(
            'ignore-dialog',
            'Ignored files',
            html,
            [
                {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: Dialogs.DIALOG_BTN_OK,
                    text: "Close"
                }
            ]
        ).done(() => {
            refreshFileTree()
        })
        let folders = prefs.get('ignored')
        let y = 0
        for(let i = 0; i < folders.length; i++) {
            let value = folders[i]
            let id = /\\/.test(value) ? (y = i, `regex-${i}`) : value
            $('#folders-table').append(`<tr data-folder-name="${id}"><td class="ext-info"><span data-folder-name="${id}">${value}</span></td><td class="ext-action"><div><button data-folder-name="${id}" class="btn btn-mini remove">supprimer</button></div></td></tr>`)
            $(`button.btn.btn-mini.remove[data-folder-name="${id}"`).on('click', ()=>{
                removeIgnored(value)
                $(`tr[data-folder-name="${id}"]`).remove()
            })
        }
        
        $('#add-button').on('click', ()=> {
            let value = $('#folder-input').val()
            let id = /\\/.test(value) ? (y++, `regex-${y}`) : value
            addIgnored(value)
            $('#folder-input').val('')
            $('#folders-table').append(`<tr data-folder-name="${id}"><td class="ext-info"><span data-folder-name="${id}">${value}</span></td><td class="ext-action"><div><button data-folder-name="${id}" class="btn btn-mini remove">supprimer</button></div></td></tr>`)
            $(`button.btn.btn-mini.remove[data-folder-name="${id}"`).on('click', ()=>{
                removeIgnored(value)
                $(`tr[data-folder-name="${id}"]`).remove()
            })
            
        })
    }
    
    
    
    updateIgnored()
    
    let ignoreID = "ignore.askIgnored";
    CommandManager.register("Ignored files", ignoreID, showModal);

    let menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(ignoreID);
    
    
    ExtensionUtils.loadStyleSheet(module, 'assets/styles.css');
    $(document.createElement('a'))
        .attr('id', 'ignore')
        .attr('href', '#')
        .attr('title', 'Ignored files')
        .on('click', function () {
            //askIgnored();
            showModal()
        })
        .appendTo($('#main-toolbar .buttons'));
    
});