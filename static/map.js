// Google Maps JavaScript API の初期化とマップ設定
var map;
var marker; // マーカーをグローバルに定義
var userLocation; // グローバル変数として定義
var selectedMemberLocation; // 選択されたメンバーの位置情報
var directionsRenderer; // ルート表示のための DirectionsRenderer のインスタンスを保持
var markers = []; // 作成したマーカーの配列
var directionsService;
var directionsDisplayed = false;
var currentUserId

// Google Maps JavaScript API の初期化とマップ設定
function initMap() {
  // 緯度と経度の取得
  getLocationAndUpdate()
  var latitude = parseFloat(document.getElementById('latitude').value);
  var longitude = parseFloat(document.getElementById('longitude').value);
  var login_user_id = parseFloat(document.getElementById('login_user_id').value);
  // console.log("latitude:",latitude, "longitude:",longitude, "login_user_id:",login_user_id)
  userLocation = new google.maps.LatLng(latitude, longitude);

  // Google Mapsの初期化
  map = new google.maps.Map(document.getElementById('map'), {
    center: userLocation,
    zoom: 16
  });

  fetchUserStatusAndSetMarker(userLocation);
  fetchGroupUsersAndSetMarkers();
  
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map); // DirectionsRenderer をマップに設定
}

// 現在のユーザーの状態を取得し、その位置にマーカーを設定
// 現在のユーザーの状態を取得し、その位置にマーカーを設定
function fetchUserStatusAndSetMarker(userLocation) {
  // console.log("fetchUserStatusAndSetMarker function called"); // 関数が呼ばれたことをログに出力

  fetch('/api/get-user-status')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // console.log("Response from get-user-status API:", data); // APIレスポンスをログに出力

      if (data.user_status) {
        var iconUrl = getIcon(currentUserId, data.user_status);

        // マーカーの設定
        marker = new google.maps.Marker({
          position: userLocation,
          map: map,
          icon: iconUrl
        });

        // console.log("Marker set with user status:", data.user_status); // マーカー設定のログ出力
      } else {
        console.error("No user status in response");
      }
    })
    .catch(error => {
      console.error('Error fetching user status:', error);
    });
}


// グループ内のユーザーの位置情報を取得し、それぞれの位置にマーカーを設定
function fetchGroupUsersAndSetMarkers() {
  fetch('/api/get-group-users')
    .then(response => response.json())
    .then(data => {
        data.group_users.forEach(user => {
            var userLocation = new google.maps.LatLng(user[2], user[3]);
            var iconUrl = getIcon(user[0], user[4]);

            var memberMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                icon: iconUrl
            });
            memberMarker.addListener('click', function() {
              selectedMemberLocation = userLocation;
              infowindow.open(map, memberMarker);
              // console.log("Selected Member Location:", selectedMemberLocation);
            });

            var infowindow = new google.maps.InfoWindow({
              content: user[1]
            });

            memberMarker.addListener('click', function() {
              infowindow.open(map, memberMarker);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching group users:', error);
    });
}

// ユーザーIDとステータスに基づいてアイコンのURLを生成
function getIconUrl(userId, userStatus) {
  var iconBasePath = '/static/map/';
  var iconType = (userId == currentUserId) ? 'user' : 'member';
  var iconFileName = iconType + '_' + userStatus + '.png';
  var fullPath = iconBasePath + iconFileName;
  // console.log("Icon URL:", fullPath); // デバッグ情報
  return fullPath;
}

// ユーザーIDとステータスに基づいてアイコンを生成
function getIcon(userId, userStatus) {
  var iconUrl = getIconUrl(userId, userStatus); // アイコンのURLを取得

  // アイコンサイズを設定
  var iconSize = new google.maps.Size(50, 50);
  return {
    url: iconUrl,
    scaledSize: iconSize // アイコンの表示サイズを設定
  };
}


function clearDirections() {
  if (directionsDisplayed) {
    directionsRenderer.setDirections({ routes: [] }); // 現在のルートをクリア
    directionsDisplayed = false; // フラグをリセット
  }
}


// 指定された2点間のルートを計算し、マップに表示
function calculateRoute(from, to) {  

  var request = {
    origin: from,
    destination: to,
    travelMode: 'WALKING'
  };

  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      clearDirections(); // 既存のルートを削除

      directionsRenderer.setDirections(result);
      directionsDisplayed = true; // ルートが表示されていることを示すフラグを設定
    } else {
      console.error('Directions request failed due to ' + status);
    }
  });

}

// ユーザーのマーカー位置を更新
function updateMarkerPosition(latitude, longitude) {
  var newLatLng = new google.maps.LatLng(latitude, longitude);
  // console.log("marker:",marker)
  if (marker) {
    marker.setPosition(newLatLng);
    // map.setCenter(newLatLng);
  }
}

// マーカーのアイコンを更新
// マーカーのアイコンを更新
function updateMarkerIcon(userId, userStatus) {
  // console.log("updateMarkerIcon called: marker:", marker);

  if (marker) {
    // console.log("Updating marker with new icon");

    // マーカーを一旦マップから削除
    marker.setMap(null);

    // 新しいアイコンのURLを取得
    var iconUrl = getIconUrl(userId, userStatus);
    // console.log("New icon URL:", iconUrl);

    var icon = {
      url: iconUrl,
      scaledSize: new google.maps.Size(50, 50) // アイコンのサイズを指定
    };

    // マーカーのアイコンを更新
    marker.setIcon(icon);

    // マーカーをマップに再追加
    marker.setMap(map);
  } else {
    console.log("No marker to update");
  }
}


// ユーザーの位置情報を取得し、更新する
function getLocationAndUpdate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      fetch('/api/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      })
      .then(response => response.json())
      .then(data => {
        // console.log('Location update successful:', data);
        updateMarkerPosition(position.coords.latitude, position.coords.longitude, '緊急'); // ステータスは例として「緊急」
      })
      .catch((error) => {
        console.error('Error updating location:', error);
      });
    }, function(error) {
      console.error('Error getting location', error);
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

// ユーザー状況を取得する関数
function getUserStatus() {
  fetch('/api/get-user-status')
    .then(response => response.json())
    .then(data => {
      if (data.user_status) {
        document.querySelector('.sub1').value = data.user_status;
      }
    })
    .catch(error => {
      console.error('Error fetching user status:', error);
    });
}

// ユーザーのステータスを更新
function updateUserStatus(user_id, status) {
  fetch('/api/update-user-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: status })
  })
  .then(response => response.json())
  .then(data => {
    // console.log('Status update successful:', data);
    // アイコンを更新
    // console.log("user_id:",user_id,"status:",status)
    updateMarkerIcon(user_id, status);
  })
  .catch(error => {
    console.error('Error updating status:', error);
  });
}

// ユーザーのステータスを取得し、UIの選択肢を更新
function fetchUserStatus() {
  fetch('/api/get-user-status')
    .then(response => response.json())
    .then(data => {
      if (data.user_status) {
        const statusSelect = document.querySelector('.sub1');
        statusSelect.value = data.user_status;

        // 「自分の状況」オプションを無効化
        const defaultOption = statusSelect.querySelector('option[value=""]');
        if (defaultOption) {
          defaultOption.disabled = true;
        }
      }
    })
    .catch(error => {
      console.error('Error fetching user status:', error);
    });
}

// 特定のメンバーのピンがクリックされたときに実行
function onMemberPinClick(memberLocation) {
  selectedMemberLocation = memberLocation;
  console.log("onMemberPinClick")
  console.log(selectedMemberLocation)
  // 必要に応じてUIの更新など
}

// マップに新しいマーカーを追加
function addMarker(location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    // その他のオプション...
  });
  markers.push(marker); // マーカーを配列に追加
  // console.log("marker:",marker)
}

// ドキュメントが読み込まれた際に実行される関数
document.addEventListener('DOMContentLoaded', function() {
  // console.log("DOMContentLoaded")
  // 'sub1' クラスを持つ select 要素を取得
  
  var statusSelect = document.querySelector('.sub1');

  // select 要素にイベントリスナーを追加
  statusSelect.addEventListener('change', function() {
    var selectedStatus = this.value; // 選択されたステータスを取得
    var userId = parseFloat(document.getElementById('login_user_id').value); // 適切なユーザーIDに置き換える
    // console.log("userID",userId)

    // updateUserStatus 関数を呼び出してステータスを更新
    updateUserStatus(userId, selectedStatus);
  });

  // console.log("ok")
  // 'create-button'というクラスを持つ要素を取得
  var createButton = document.querySelector('.create-button');
  // console.log("createButton :",createButton)
  // console.log(createButton)
  createButton.addEventListener('click', function() {
    // console.log("Current selectedMemberLocation:", selectedMemberLocation);
    if (selectedMemberLocation) {
      // ルートを計算する関数を呼び出す
      calculateRoute(userLocation, selectedMemberLocation);
    } else {
      alert('メンバーが選択されていません！');
    }
  });
  initMap();
});

// 位置情報を更新するためのインターバル設定
setInterval(getLocationAndUpdate, 10000); // 10秒ごとに更新
setInterval(fetchGroupUsersAndSetMarkers, 10000); // 10秒ごとに更新