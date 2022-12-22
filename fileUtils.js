const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

var readAddressesFromJsonFile = (filePath) => {
  let file = Gio.File.new_for_path(filePath);
  let [success, contents] = file.load_contents(null);
  if (success) {
    let data = JSON.parse(contents);
    return data.addresses;
  } else {
    throw new Error('Unable to read JSON file');
  }
};

var writeAddressesToJsonFile = (filePath, addresses) => {
  let data = {
     "addresses": addresses
  };
  let contents = JSON.stringify(data, null, 2);
  let file = Gio.File.new_for_path(filePath);
  if (!file.query_exists(null)) {
     file.get_parent().make_directory_with_parents(null);
  }
  file.replace_contents(contents, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
};
