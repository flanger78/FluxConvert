// Previne janela de console adicional no Windows em modo release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    fluxconvert_lib::run();
}
