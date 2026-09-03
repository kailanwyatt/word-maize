import { ReactNode, useRef } from 'react';
import { GestureResponderEvent, StyleProp, View, ViewStyle } from 'react-native';
import { classifyMovement, GestureMode, resolvePointerRelease } from '../../game/gestures';

type Props = {
  movementThreshold: number;
  onRotateStart: () => void;
  onRotateMove: (dx: number) => void;
  onRotateEnd: () => void;
  onTap: (x: number, y: number) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

type MeasurableNode = {
  getBoundingClientRect?: () => { left: number; top: number };
};

function cobLocalPoint(event: GestureResponderEvent, node: MeasurableNode | null): { x: number; y: number } {
  const native = event.nativeEvent;
  if (Number.isFinite(native.locationX) && Number.isFinite(native.locationY)) {
    return { x: native.locationX, y: native.locationY };
  }
  if (node?.getBoundingClientRect && Number.isFinite(native.pageX) && Number.isFinite(native.pageY)) {
    const rect = node.getBoundingClientRect();
    const clientX = native.pageX - (typeof window !== 'undefined' ? window.scrollX : 0);
    const clientY = native.pageY - (typeof window !== 'undefined' ? window.scrollY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  return { x: native.locationX ?? 0, y: native.locationY ?? 0 };
}

export function TapGestureArbitrator({
  movementThreshold,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
  onTap,
  style,
  children,
}: Props) {
  const modeRef = useRef<GestureMode>('pending');
  const startPageX = useRef(0);
  const startLocal = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<View>(null);
  const callbacks = useRef({ onRotateStart, onRotateMove, onRotateEnd, onTap, movementThreshold });
  callbacks.current = { onRotateStart, onRotateMove, onRotateEnd, onTap, movementThreshold };

  const onTouchStart = (event: GestureResponderEvent) => {
    modeRef.current = 'pending';
    startPageX.current = event.nativeEvent.pageX;
    startLocal.current = cobLocalPoint(event, nodeRef.current as MeasurableNode | null);
  };

  const onTouchMove = (event: GestureResponderEvent) => {
    const dx = event.nativeEvent.pageX - startPageX.current;
    const next = classifyMovement(dx, 0, callbacks.current.movementThreshold, modeRef.current);
    if (next === 'rotate' && modeRef.current !== 'rotate') callbacks.current.onRotateStart();
    modeRef.current = next;
    if (next === 'rotate') callbacks.current.onRotateMove(dx);
  };

  const onTouchEnd = (event: GestureResponderEvent) => {
    const dx = event.nativeEvent.pageX - startPageX.current;
    const resolved = resolvePointerRelease(modeRef.current, dx, callbacks.current.movementThreshold);
    modeRef.current = 'pending';
    if (resolved === 'rotate') {
      callbacks.current.onRotateEnd();
      return;
    }
    const point = cobLocalPoint(event, nodeRef.current as MeasurableNode | null);
    const x = Number.isFinite(point.x) ? point.x : startLocal.current.x;
    const y = Number.isFinite(point.y) ? point.y : startLocal.current.y;
    callbacks.current.onTap(x, y);
  };

  const onTouchCancel = () => {
    const wasRotate = modeRef.current === 'rotate';
    modeRef.current = 'pending';
    if (wasRotate) callbacks.current.onRotateEnd();
  };

  return (
    <View
      ref={nodeRef}
      collapsable={false}
      style={style}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {children}
    </View>
  );
}
