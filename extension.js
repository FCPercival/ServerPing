'use strict';

const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const FileUtils = Me.imports.fileUtils; // Import the "fileUtils" module to read the JSON file

let myPopup;
let timer;
const UPDTEDLY="update-interval";
const LIMITFORGOOD = "limitforgood";
const LIMITFORBAD="limitforbad";
let tagWatchOUT;
let tagWatchERR;
let feedsArray;

const MyPopup = GObject.registerClass( class MyPopup extends PanelMenu.Button {


  _init () {

    super._init(0);

    // Indicator icon
    let icon = new St.Icon({
      icon_name : 'security-low-symbolic',
      gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/icon.svg' ),
      style_class : 'system-status-icon',
    });

    this.add_child(icon);

    // Reads the address values from the JSON file and sets them in the "addresses" array
    let filePath = GLib.get_home_dir() + '/.config/serverping/addresses.json';
    try {
    	this.addresses = FileUtils.readAddressesFromJsonFile(filePath);
    } catch (error) {
    	log('[ServerPing]: '+error+' --> Creating the serverping folder and creating the default configuration');
    	// If the JSON file doesn't exist, set a default file with the values of "addresses"
    	this.addresses = [{'name': 'Google', 'address': 'www.google.com'}, {'name': 'Yahoo', 'address': 'www.yahoo.com'}, {'name': 'Bing', 'address': 'www.bing.com'}];
    	FileUtils.writeAddressesToJsonFile(filePath, this.addresses);
    }

  }

  update() {
    // log('[ServerPing]: '+'refresh');
    
    // Cleans up the menu before adding new menu items
    this.menu.removeAll();

    // Ping each address and update the label with the ping result
    for (let i = 0; i < this.addresses.length; i++) {
        let address = this.addresses[i].address;
        let name = this.addresses[i].name;

        //let [res, out, err, status]= GLib.spawn_command_line_sync('ping -c 1 ' + address);
        let success, child_pid, std_in, std_out, std_err;
        let command = ["ping","-c 1", address];
        [success, child_pid, std_in, std_out, std_err] = GLib.spawn_async_with_pipes(
            null,
            command,
            null,
            GLib.SpawnFlags.SEARCH_PATH,
            null);

        //GLib.close(this.std_in);


        //this.IOchannelOUT = GLib.IOChannel.unix_new(this.std_out);
        //this.IOchannelERR = GLib.IOChannel.unix_new(this.std_err);
//
        //tagWatchOUT = GLib.io_add_watch(this.IOchannelOUT, GLib.PRIORITY_DEFAULT,
        //    GLib.IOCondition.IN | GLib.IOCondition.HUP, this.loadPipeOUT );
//
        //tagWatchERR = GLib.io_add_watch(this.IOchannelERR, GLib.PRIORITY_DEFAULT,
        //    GLib.IOCondition.IN | GLib.IOCondition.HUP,this.loadPipeERR );


        //log(std_out);
        let responseTimelabel= std_out;
        //try{
        //  responseTimelabel= parseInt(out.toString().match(/time=(\d+)/)[1]);
        //}catch (TypeError){
        //  let color = 'flag';
        //  this.menu.addMenuItem(new PopupMenu.PopupImageMenuItem(name + ': inf ms', color));
        //}


        let color;
        try{
            if (success === true) {
                if (responseTimelabel < 100) {
                    //color = new St.Icon({
                    //  icon_name : 'security-low-symbolic',
                    //  gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/green.svg' ),
                    //  style_class : 'system-status-icon',
                    //});
                    //color = '#00FF00';
                    color = 'flag-green';
                } else if (responseTimelabel < 500) {
                    //color = new St.Icon({
                                                  //              icon_name : 'security-low-symbolic',
                                  //              gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/yellow.svg' ),
                                  //              style_class : 'system-status-icon',
                                  //            });
                    //color = '#FFFF00';
                    color = 'flag-yellow';
                } else {
                    //color = new St.Icon({
                    //                              icon_name : 'security-low-symbolic',
                    //                              gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/red.svg' ),
                    //                              style_class : 'system-status-icon',
                    //                            });
                    //color = '#FF0000';
                    color = 'flag-red';
                }
                // Adds a menu item with the ping result
                this.menu.addMenuItem(new PopupMenu.PopupImageMenuItem(name + ': ' + responseTimelabel + 'ms', color));

            } else {
                //let color = new St.Icon({
                //                                          icon_name : 'security-low-symbolic',
                //                                          gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/red.svg' ),
                //                                          style_class : 'system-status-icon',
                //                                        });
                // Adds a menu item with the ping result
                color = 'flag';
                this.menu.addMenuItem(new PopupMenu.PopupImageMenuItem(name + ': inf ms', color));
            }
        }catch(ReferenceError){
          color = 'flag';
          this.menu.addMenuItem(new PopupMenu.PopupImageMenuItem(name + ': inf ms', color));
        }
    }
    // Adds a "settings" menu item that opens the "addresses.json" file
    let settingsItem = new PopupMenu.PopupImageMenuItem("Settings", 'settings');
    settingsItem.connect('activate', () => {
       let file = Gio.File.new_for_path( GLib.get_home_dir() + '/.config/serverping/addresses.json' );
       try {
           [success, pid] = GLib.spawn_async(
               null,
               ['xdg-open', file.get_path()],
               null,
               GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
               null
           );
       } catch (err) {
           log('[ServerPing]: '+err);
       }

     });
     this.menu.addMenuItem(settingsItem);
  }
});

function enable() {

    // Create the new indicator model
    myPopup = new MyPopup()

    // Initialize the ping timer
    timer = Mainloop.timeout_add(5000, function() {
        myPopup.update();
        return true;
    });

    // Adds the indicator model to the panel
    Main.panel.addToStatusArea('ping-indicator', myPopup, 0, 'right');
}

function disable() {
    // Remove the ping timer
    Mainloop.source_remove(timer);
    timer = null;

    // Removes the indicator model from the panel
    myPopup.destroy();
    myPopup=null;
}



