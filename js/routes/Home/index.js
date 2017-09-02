// @flow
import React, { Component } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';

import BasicContainer from 'DoOfflineFirstApps/js/components/BasicContainer';
import Button from 'DoOfflineFirstApps/js/components/Button';
import { getImages, getNewImages, toggleLike, retryImages } from 'DoOfflineFirstApps/js/services/images/thunks';
import { selectImages, selectErroredImages, selectPendingImages } from 'DoOfflineFirstApps/js/services/images/selectors';
import { reportImage, removeImage } from 'DoOfflineFirstApps/js/services/images/actions';
import { isConnected } from 'DoOfflineFirstApps/js/services/network/selectors';
import type { ImageFromServer, ImageToUpload, Navigation } from 'DoOfflineFirstApps/js/types';
import colors from 'DoOfflineFirstApps/js/colors';
import { withCheckInternet } from 'DoOfflineFirstApps/js/api';

import CatImage from 'DoOfflineFirstApps/js/components/CatImage';

type Props = {
    erroredImages: [ImageToUpload],
    getImages: () => void,
    images: [ImageFromServer],
    isConnected: boolean,
    pendingImages: [ImageToUpload],
    onLikePress: () => void,
    onRefresh: () => void,
    onReportPress: () => void,
    retryImages: () => void,
    removeImage: () => void,
};
type State = {
    refreshing: boolean,
};

class HomeScreen extends Component<void, Props, State> {
    static navigationOptions = ({
        navigation,
    }: {
        navigation: Navigation,
    }): ReactElement<*> => {
        const goToAdd = (): void => navigation.navigate('ImageAdd');

        return {
            title: 'InstaMeow',
            headerRight: (
                <Button
                    onPress={goToAdd}
                    style={styles.rightHeaderText}
                    noShadow
                    noBorder
                >
                    <Image
                        source={require('DoOfflineFirstApps/js/images/add.png')}
                        style={styles.addIcon}
                    />
                </Button>
            ),
        };
    };

    static defaultProps = {
        images: [],
    };

    state = { refreshing: false };

    componentWillReceiveProps() {
        this.setState({ refreshing: false });
    }

    handleGetMorePress = () => {
        this.setState({ refreshing: true });
        this.props.getImages();
    };
    handleRetryErroredPress = () => {
        this.props.retryImages(this.props.erroredImages);
    };

    createCatImagePressHandler = (catImage: ImageToUpload | ImageFromServer) => () => {
        this.props.navigation.navigate('ImageDetail', catImage);
    };

    _extractKey = (item: ImageFromServer): string => item.uuid;

    _renderItem = ({ item }: { item: ImageFromServer }): ReactElement<*> => (
        <CatImage
            {...item}
            onPress={this.createCatImagePressHandler(item)}
            onLikePress={this.props.onLikePress}
            onReportPress={this.props.onReportPress}
            removeImage={this.props.removeImage}
        />
    );

    render() {
        let headerComponent = null;
        let erroredImages = null;
        let pendingImages = null;
        let connection = null;

        if (!this.props.isConnected) {
            connection = (
                <Text style={styles.connection}>
                    {'Looking for a connection...'}
                </Text>
            );
        }
        if (this.props.erroredImages && this.props.erroredImages.length) {
            erroredImages = (
                <View style={styles.rowContainer}>
                    {this.props.erroredImages.map((image: ImageToUpload) => (
                        <CatImage
                            {...image}
                            key={`errored-${image.uploadedTryAt}`}
                            queue
                            errored
                        />
                    ))}
                    <Button
                        style={styles.retry}
                        text={'Retry'}
                        onPress={this.handleRetryErroredPress}
                    />
                </View>
            );
        }
        if (this.props.pendingImages && this.props.pendingImages.length) {
            pendingImages = (
                <View style={styles.rowContainer}>
                    {this.props.pendingImages.map((image: ImageToUpload) => (
                        <CatImage
                            {...image}
                            key={`pending-${image.uploadedTryAt}`}
                            onPress={this.createCatImagePressHandler(image)}
                            queue
                        />
                    ))}
                    <ActivityIndicator style={styles.loader} />
                </View>
            );
        }
        if (connection || pendingImages || erroredImages) {
            headerComponent = (
                <View style={styles.header}>
                    {connection}
                    {erroredImages}
                    {pendingImages}
                </View>
            );
        }

        return (
            <BasicContainer>
                <FlatList
                    renderItem={this._renderItem}
                    keyExtractor={this._extractKey}
                    data={this.props.images}
                    onRefresh={this.props.onRefresh}
                    refreshing={this.state.refreshing}
                    ListEmptyComponent={this.props.isConnected
                        ? null
                        : <Image
                            source={require('DoOfflineFirstApps/js/images/sadcat.jpg')}
                            style={styles.offlineCat}
                            resizeMode={'contain'}
                        />
                    }
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={this.props.isConnected
                        ? <Button
                            style={styles.getMore}
                            onPress={this.handleGetMorePress}
                            text={`Give me some ${this.props.images.length ? 'more' : ''} 😻 !`}
                        />
                        : null
                    }
                />
            </BasicContainer>
        );
    }
}

const mapStateToProps = createStructuredSelector({
    images: selectImages(),
    erroredImages: selectErroredImages(),
    pendingImages: selectPendingImages(),
    isConnected: isConnected(),
});
const mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        {
            getImages,
            onLikePress: toggleLike,
            onRefresh: getNewImages,
            onReportPress: reportImage,
            retryImages,
            removeImage,
        },
        dispatch
    );

export default withCheckInternet(
    connect(mapStateToProps, mapDispatchToProps)(HomeScreen)
);

const styles = StyleSheet.create({
    rightHeaderText: {
        padding: 5,
        backgroundColor: colors.transparent,
        marginBottom: 10,
    },
    addIcon: {
        width: 23,
        height: 23,
    },
    rowContainer: {
        flexDirection: 'row',
    },
    offlineCat: {
        alignSelf: 'center',
        width: 300,
        height: 450,
        opacity: 0.2,
    },
    connection: {
        backgroundColor: colors.lightOrange,
        color: colors.darkOrange,
        textAlign: 'center',
        padding: 10,
    },
    loader: {
        margin: 10,
    },
    getMore: {
        marginBottom: 20,
    },
    retry: {
        marginTop: 0,
        marginLeft: 10,
    },
});
