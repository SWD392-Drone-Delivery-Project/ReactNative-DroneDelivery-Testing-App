import React from 'react';
import MapViewNative, { Marker, Polyline, Callout } from 'react-native-maps';

export const MapView = React.forwardRef((props, ref) => {
    return (
        <MapViewNative
            {...props}
            ref={ref}
            onPress={(e) => {
                if (props.onMapClick) {
                    props.onMapClick(e.nativeEvent.coordinate);
                }
                if (props.onPress) {
                    props.onPress(e);
                }
            }}
        />
    );
});

export { Marker, Polyline, Callout };
export default MapView;
