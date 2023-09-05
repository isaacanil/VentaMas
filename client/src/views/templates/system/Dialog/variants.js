const BackdropVariants = {
    hidden: {
        opacity: 0,
        pointerEvent: 'none'
    },
    visible: {
        opacity: 1,
        pointerEvent: 'auto'
    }
}
const ContainerVariants = {
    hidden: {
        opacity: 0,
        scale: 0.5
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    }
}

export { BackdropVariants, ContainerVariants }