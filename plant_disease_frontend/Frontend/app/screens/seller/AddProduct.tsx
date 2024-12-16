import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Image,
    TouchableOpacity,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system'

interface Product {
    _id: string
    description: string
    image: string
    name: string
    price: string
    quantity: string
    seller_id: string
}

const AddProduct = ({ navigation }: { navigation: any }) => {
    const route = useRoute<RouteProp<any, 'Add Product'>>()
    const product = route?.params?.product || null

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [quantity, setQuantity] = useState('')
    const [image, setImage] = useState<string | null>(null)
    const [newImage, setNewImage] = useState<{
        uri: string
        name: string
        type: string
        data: string
    } | null>(null)

    // Reset state when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            if (product) {
                setName(product.name || '')
                setDescription(product.description || '')
                setPrice(product.price?.toString() || '')
                setQuantity(product.quantity?.toString() || '')

                const imageName = product.image.split('/').pop()
                setImage(
                    `https://majorproject-production-af32.up.railway.app/admin/preview/${imageName}`,
                )
            } else {
                setName('')
                setDescription('')
                setPrice('')
                setQuantity('')
                setImage(null)
                setNewImage(null)
            }
        }, [product]),
    )

    const handleImageUpload = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        })

        if (!result.canceled) {
            const { uri } = result.assets[0]

            // Read the file as base64 to embed in the form
            const fileInfo = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            })

            const fileName = uri.split('/').pop()
            const fileType = uri.split('.').pop()

            // Store file details in state
            setNewImage({
                uri: uri,
                name: fileName || '',
                type: `image/${fileType}`,
                data: fileInfo, // Base64 encoded image data
            })
        }
    }

    const handleSaveProduct = async () => {
        const url = product
            ? `https://majorproject-production-af32.up.railway.app/marketplace/update/${product._id}`
            : 'https://majorproject-production-af32.up.railway.app/marketplace/add'

        const method = product ? 'PUT' : 'POST'

        const formData = new FormData()
        formData.append('name', name)
        formData.append('description', description)
        formData.append('price', price)
        formData.append('quantity', quantity)

        if (newImage) {
            // Append the image details to the FormData object
            formData.append('image', {
                uri: newImage.uri,
                name: newImage.name,
                type: newImage.type,
                // Include the base64 data if necessary, depending on your backend's handling
                data: newImage.data,
            } as any)
        }
        try {
            const token = await AsyncStorage.getItem('token')
            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (response.ok) {
                Alert.alert(
                    'Success',
                    product ? 'Product updated' : 'Product added',
                )

                navigation.navigate('All Products')
            } else {
                Alert.alert('Error', 'Failed to save product')
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong')
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>
                {product ? 'Update Product' : 'Add Product'}
            </Text>
            <TextInput
                placeholder='Name'
                value={name}
                onChangeText={setName}
                style={styles.input}
            />
            <TextInput
                placeholder='Description'
                value={description}
                onChangeText={setDescription}
                style={styles.input}
            />
            <TextInput
                placeholder='Price'
                value={price}
                onChangeText={setPrice}
                keyboardType='numeric'
                style={styles.input}
            />
            <TextInput
                placeholder='Quantity'
                value={quantity}
                onChangeText={setQuantity}
                keyboardType='numeric'
                style={styles.input}
            />
            {image && !newImage && (
                <Image
                    source={{ uri: image }}
                    style={{ width: 150, height: 150, marginBottom: 16 }}
                />
            )}
            {newImage && (
                <Image
                    source={{ uri: newImage.uri }}
                    style={{ width: 150, height: 150, marginBottom: 16 }}
                />
            )}
            <TouchableOpacity
                onPress={handleImageUpload}
                style={styles.uploadButton}
            >
                <Text style={styles.uploadText}>
                    {newImage || image ? 'Change Image' : 'Upload Image'}
                </Text>
            </TouchableOpacity>
            <Button
                title={product ? 'Update Product' : 'Add Product'}
                onPress={handleSaveProduct}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    uploadButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        marginBottom: 16,
    },
    uploadText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
})

export default AddProduct